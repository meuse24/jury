<?php
// GET /api/admin/evaluations

require_once __DIR__ . '/../Repository/repositories.php';
require_role('admin');

json_response(['evaluations' => array_values(eval_repo()->findAll())]);
