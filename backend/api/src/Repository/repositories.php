<?php
// ===================================================================
// repositories.php — Repository interfaces + JSON implementations
// Swap JSON implementations for MySQL ones without touching endpoints.
// ===================================================================

require_once __DIR__ . '/JsonStore.php';

// ---- Shared store instance ----
function get_store(): JsonStore
{
    static $store = null;
    if ($store === null) {
        $store = new JsonStore(DATA_DIR);
    }
    return $store;
}

// ===================================================================
// UserRepository
// ===================================================================
interface UserRepository
{
    public function findAll(): array;
    public function findById(string $id): ?array;
    public function findByUsername(string $username): ?array;
    public function create(array $user): array;
    public function update(string $id, array $changes): ?array;
    public function delete(string $id): bool;
}

class JsonUserRepository implements UserRepository
{
    private const STORE = 'users';
    private JsonStore $store;

    public function __construct(JsonStore $store) { $this->store = $store; }

    public function findAll(): array { return $this->store->readAll(self::STORE); }
    public function findById(string $id): ?array { return $this->store->findById(self::STORE, $id); }

    public function findByUsername(string $username): ?array
    {
        $results = $this->store->findWhere(self::STORE, fn($u) => $u['username'] === $username);
        return $results[0] ?? null;
    }

    public function create(array $user): array { return $this->store->insert(self::STORE, $user); }

    public function update(string $id, array $changes): ?array
    {
        $changes['updated_at'] = now_ts();
        return $this->store->update(self::STORE, $id, $changes);
    }

    public function delete(string $id): bool { return $this->store->delete(self::STORE, $id); }
}

// ===================================================================
// EvaluationRepository
// ===================================================================
interface EvaluationRepository
{
    public function findAll(): array;
    public function findById(string $id): ?array;
    public function create(array $evaluation): array;
    public function update(string $id, array $changes): ?array;
    public function delete(string $id): bool;
}

class JsonEvaluationRepository implements EvaluationRepository
{
    private const STORE = 'evaluations';
    private JsonStore $store;

    public function __construct(JsonStore $store) { $this->store = $store; }

    public function findAll(): array { return $this->store->readAll(self::STORE); }
    public function findById(string $id): ?array { return $this->store->findById(self::STORE, $id); }
    public function create(array $evaluation): array { return $this->store->insert(self::STORE, $evaluation); }

    public function update(string $id, array $changes): ?array
    {
        $changes['updated_at'] = now_ts();
        return $this->store->update(self::STORE, $id, $changes);
    }

    public function delete(string $id): bool { return $this->store->delete(self::STORE, $id); }
}

// ===================================================================
// SubmissionRepository
// ===================================================================
interface SubmissionRepository
{
    public function findByEvaluation(string $evaluationId): array;
    /** All submissions for this user in this evaluation (one per candidate, or one if no candidates) */
    public function findByUserAndEvaluation(string $userId, string $evaluationId): array;
    /** Single submission for user + evaluation + candidate (null = no-candidate mode) */
    public function findByUserEvaluationAndCandidate(string $userId, string $evaluationId, ?string $candidateId): ?array;
    public function upsert(string $userId, string $evaluationId, array $submissionData): array;
    public function delete(string $id): bool;
}

class JsonSubmissionRepository implements SubmissionRepository
{
    private const STORE = 'submissions';
    private JsonStore $store;

    public function __construct(JsonStore $store) { $this->store = $store; }

    public function findByEvaluation(string $evaluationId): array
    {
        return $this->store->findWhere(self::STORE, fn($s) => $s['evaluation_id'] === $evaluationId);
    }

    public function findByUserAndEvaluation(string $userId, string $evaluationId): array
    {
        return $this->store->findWhere(
            self::STORE,
            fn($s) => $s['user_id'] === $userId && $s['evaluation_id'] === $evaluationId
        );
    }

    public function findByUserEvaluationAndCandidate(string $userId, string $evaluationId, ?string $candidateId): ?array
    {
        $results = $this->store->findWhere(
            self::STORE,
            fn($s) => $s['user_id'] === $userId
                && $s['evaluation_id'] === $evaluationId
                && ($s['candidate_id'] ?? null) === $candidateId
        );
        return $results[0] ?? null;
    }

    public function upsert(string $userId, string $evaluationId, array $submissionData): array
    {
        $candidateId = $submissionData['candidate_id'] ?? null;
        $existing    = $this->findByUserEvaluationAndCandidate($userId, $evaluationId, $candidateId);
        if ($existing !== null) {
            $changes = array_merge($submissionData, ['updated_at' => now_ts()]);
            return $this->store->update(self::STORE, $existing['id'], $changes);
        }
        $submissionData['id']            = generate_uuid();
        $submissionData['user_id']       = $userId;
        $submissionData['evaluation_id'] = $evaluationId;
        $submissionData['candidate_id']  = $candidateId;
        $submissionData['submitted_at']  = now_ts();
        $submissionData['updated_at']    = now_ts();
        return $this->store->insert(self::STORE, $submissionData);
    }

    public function delete(string $id): bool { return $this->store->delete(self::STORE, $id); }
}

// ===================================================================
// Factory — returns repository instances
// ===================================================================
function user_repo(): UserRepository           { return new JsonUserRepository(get_store()); }
function eval_repo(): EvaluationRepository     { return new JsonEvaluationRepository(get_store()); }
function submission_repo(): SubmissionRepository { return new JsonSubmissionRepository(get_store()); }
