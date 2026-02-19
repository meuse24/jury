<?php
// GET /api/admin/users

require_once __DIR__ . '/../Repository/repositories.php';
require_role('admin');

$users = array_map('user_public', user_repo()->findAll());
json_response(['users' => array_values($users)]);
