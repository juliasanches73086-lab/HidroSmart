<?php
declare(strict_types=1);
require __DIR__ . '/db.php';
try {
    $db = database();
    $sectors = $db->query(<<<'SQL'
        SELECT h.codigo, s.nome AS setor, h.tipo_medicao,
               COALESCE(m.volume_meta_m3,0) AS meta_outubro
        FROM hidrometro h
        JOIN setor s ON s.id_setor = h.id_setor
        LEFT JOIN meta_consumo m ON m.id_setor = s.id_setor
            AND m.ano_mes = '2026-10-01'
        ORDER BY h.id_hidrometro
    SQL)->fetchAll();
    $readings = $db->query(<<<'SQL'
        SELECT h.codigo, DATE_FORMAT(l.data_hora,'%Y-%m') AS mes,
               ROUND(SUM(l.consumo_m3),2) AS consumo_m3
        FROM leitura l
        JOIN hidrometro h ON h.id_hidrometro=l.id_hidrometro
        WHERE l.data_hora >= '2026-01-01' AND l.data_hora < '2026-11-01'
        GROUP BY h.codigo, DATE_FORMAT(l.data_hora,'%Y-%m')
        ORDER BY h.codigo, mes
    SQL)->fetchAll();
    $daily = $db->query(<<<'SQL'
        SELECT h.codigo, DATE_FORMAT(l.data_hora,'%Y-%m-%d') AS dia,
               ROUND(SUM(l.consumo_m3),4) AS consumo_m3
        FROM leitura l
        JOIN hidrometro h ON h.id_hidrometro=l.id_hidrometro
        WHERE l.data_hora >= '2026-10-01' AND l.data_hora < '2026-11-01'
        GROUP BY h.codigo, DATE_FORMAT(l.data_hora,'%Y-%m-%d')
        ORDER BY h.codigo, dia
    SQL)->fetchAll();
    $alerts = $db->query(<<<'SQL'
        SELECT a.id_alerta, h.codigo, s.nome AS setor, ta.codigo AS tipo,
               a.status, DATE_FORMAT(a.data_hora,'%d/%m/%Y') AS data,
               a.observacao,
               ROUND(CASE WHEN a.media_referencia > 0 THEN
                  (a.valor_identificado/a.media_referencia-1)*100
               ELSE 0 END,1) AS variacao_percentual
        FROM alerta a
        JOIN hidrometro h ON h.id_hidrometro=a.id_hidrometro
        JOIN setor s ON s.id_setor=h.id_setor
        JOIN tipo_alerta ta ON ta.id_tipo_alerta=a.id_tipo_alerta
        ORDER BY a.data_hora DESC, a.id_alerta DESC
    SQL)->fetchAll();
    $tarifa = $db->query(<<<'SQL'
        SELECT valor_m3 FROM tarifa
        WHERE data_inicio <= '2026-10-31'
          AND (data_fim IS NULL OR data_fim >= '2026-10-31')
        ORDER BY data_inicio DESC LIMIT 1
    SQL)->fetchColumn();
    json_response([
        'sectors'=>$sectors,'readings'=>$readings,'daily'=>$daily,
        'alerts'=>$alerts,'tarifa'=>$tarifa === false ? 0 : (float)$tarifa,
        'referenceYear'=>2026,'simulated'=>true
    ]);
} catch (Throwable $e) {
    error_log('HidroSmart dashboard: ' . $e->getMessage());
    json_response(['error'=>'Falha ao consultar o banco. Confira config.php e o esquema hidrosmart.'], 503);
}
