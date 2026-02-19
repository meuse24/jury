<?php
// ===================================================================
// models.php — Data model factory functions
// Structures match the JSON files stored in data/
// ===================================================================

/**
 * User model:
 * {
 *   "id": "uuid",
 *   "username": "string",
 *   "password_hash": "string",
 *   "role": "admin|jury",
 *   "name": "string",
 *   "created_at": timestamp,
 *   "updated_at": timestamp
 * }
 */
function make_user(string $username, string $password_hash, string $role, string $name): array
{
    return [
        'id'            => generate_uuid(),
        'username'      => $username,
        'password_hash' => $password_hash,
        'role'          => $role,
        'name'          => $name,
        'created_at'    => now_ts(),
        'updated_at'    => now_ts(),
    ];
}

function user_public(array $user): array
{
    return array_except($user, ['password_hash']);
}

/**
 * Evaluation model:
 * {
 *   "id": "uuid",
 *   "title": "string",
 *   "description": "string",
 *   "categories": [ { "id": uuid, "name": string, "description": string, "max_score": int } ],
 *   "submission_open_at": timestamp,
 *   "submission_close_at": timestamp,
 *   "results_publish_at": timestamp,
 *   "results_is_published": bool,
 *   "results_published_at": timestamp|null,
 *   "jury_assignments": [userId, ...],
 *   "created_at": timestamp,
 *   "updated_at": timestamp
 * }
 */
function make_evaluation(array $data): array
{
    return [
        'id'                   => generate_uuid(),
        'title'                => $data['title'],
        'description'          => $data['description'] ?? '',
        'categories'           => $data['categories'] ?? [],
        'submission_open_at'   => $data['submission_open_at'],
        'submission_close_at'  => $data['submission_close_at'],
        'results_publish_at'   => $data['results_publish_at'],
        'results_is_published' => false,
        'results_published_at' => null,
        'jury_assignments'     => [],
        'created_at'           => now_ts(),
        'updated_at'           => now_ts(),
    ];
}

function make_category(string $name, string $description, int $maxScore): array
{
    return [
        'id'          => generate_uuid(),
        'name'        => $name,
        'description' => $description,
        'max_score'   => $maxScore,
    ];
}

/**
 * Submission model:
 * {
 *   "id": "uuid",
 *   "evaluation_id": "uuid",
 *   "user_id": "uuid",
 *   "scores": [ { "category_id": uuid, "score": int } ],
 *   "comment": "string|null",
 *   "submitted_at": timestamp,
 *   "updated_at": timestamp
 * }
 */
function make_submission(string $evaluationId, string $userId, array $scores, ?string $comment = null): array
{
    return [
        'id'            => generate_uuid(),
        'evaluation_id' => $evaluationId,
        'user_id'       => $userId,
        'scores'        => $scores,
        'comment'       => $comment,
        'submitted_at'  => now_ts(),
        'updated_at'    => now_ts(),
    ];
}
