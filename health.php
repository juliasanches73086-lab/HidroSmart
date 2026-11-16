<?php
declare(strict_types=1);
require __DIR__ . '/db.php';
try {
    $db = database();
    $db->query('SELECT 1');
    json_response(['status'=>'ok','database'=>'connected']);
} catch (Throwable $e) {
    error_log('HidroSmart health: ' . $e->getMessage());
    json_response(['status'=>'error','database'=>'unavailable','message'=>'Confira a senha, porta e o serviço MySQL.'], 503);
}
