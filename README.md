# HidroSmart — PHP + MySQL + XAMPP

Projeto acadêmico com frontend HTML/CSS/JavaScript e API PHP que **lê** o banco MySQL `hidrosmart` existente.

## Iniciar rapidamente no Windows

1. Extraia o conteúdo do ZIP para `C:\xampp\htdocs\sites\HidroSmartPHP` (uma pasta nova, sem mexer na pasta Java anterior).
2. Na pasta `api`, renomeie `config.example.php` para `config.php`. Abra `config.php` com o Bloco de Notas e troque `COLOQUE_SUA_SENHA_AQUI` pela senha do MySQL que funciona no Workbench. Não envie essa senha a ninguém.
3. No painel do XAMPP, clique em **Start** para **Apache**. **Não inicie outro MySQL do XAMPP** se o MySQL Server do Workbench já estiver ativo na porta 3306.
4. Abra `http://localhost/sites/HidroSmartPHP/api/health.php`. Deve aparecer `"status":"ok"` e `"database":"connected"`.
5. Abra `http://localhost/sites/HidroSmartPHP/` para usar o site.

Se o Apache usar outra porta, por exemplo 8080, acesse `http://localhost:8080/sites/HidroSmartPHP/`.

## Banco de dados

Este pacote **não contém script de exclusão nem recriação**. Ele utiliza o banco local já criado, com as tabelas `hidrometro`, `setor`, `leitura`, `alerta`, `tipo_alerta`, `tarifa` e `meta_consumo`.

## GitHub

**Nunca envie `api/config.php` com sua senha.** O `.gitignore` impede que ele seja adicionado normalmente via Git. Se fizer upload manual pelo navegador, confira e **não selecione** esse arquivo. Envie `api/config.example.php` como modelo e os demais arquivos do projeto.

O GitHub armazena o código; não executa PHP/MySQL no GitHub Pages. Para o site funcionar fora do seu computador, é necessário hospedagem com PHP e MySQL ou serviço equivalente.

## Observações

- Os registros são fictícios e as consultas são somente leitura.
- Filtros de 7 e 30 dias são relativos a outubro/2026, o período da simulação.
- O mapa hidráulico é esquemático.
- A conexão local precisa ser testada no seu computador.
