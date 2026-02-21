<?php
// ===================================================================
// JsonStore.php — Atomic JSON file read/write with flock
// ===================================================================

class JsonStore
{
    private string $dir;

    public function __construct(string $dir)
    {
        $this->dir = rtrim($dir, '/\\');
        if (!is_dir($this->dir)) {
            mkdir($this->dir, 0750, true);
        }
    }

    private function filePath(string $name): string
    {
        // Sanitise: only allow alphanumeric, dashes, underscores
        if (!preg_match('/^[a-zA-Z0-9_\-]+$/', $name)) {
            throw new \InvalidArgumentException("Invalid store name: $name");
        }
        return $this->dir . '/' . $name . '.json';
    }

    private function lockPath(string $name): string
    {
        if (!preg_match('/^[a-zA-Z0-9_\-]+$/', $name)) {
            throw new \InvalidArgumentException("Invalid store name: $name");
        }
        return $this->dir . '/.' . $name . '.lock';
    }

    /**
     * Execute a callback while holding an exclusive lock for a store.
     */
    public function withExclusiveLock(string $name, callable $fn): mixed
    {
        $lockFile = $this->lockPath($name);
        $fp = fopen($lockFile, 'c');
        if (!$fp) {
            throw new \RuntimeException("Cannot open lock file for $name.");
        }
        if (!flock($fp, LOCK_EX)) {
            fclose($fp);
            throw new \RuntimeException("Cannot acquire lock for $name.");
        }
        try {
            return $fn();
        } finally {
            flock($fp, LOCK_UN);
            fclose($fp);
        }
    }

    /**
     * Read all records from a collection file.
     * Returns an array of records (keyed by 'id').
     */
    public function readAll(string $name): array
    {
        $file = $this->filePath($name);
        if (!file_exists($file)) {
            return [];
        }

        $fp = fopen($file, 'r');
        if (!$fp) {
            throw new \RuntimeException("Cannot open $file for reading.");
        }
        flock($fp, LOCK_SH);
        $contents = stream_get_contents($fp);
        flock($fp, LOCK_UN);
        fclose($fp);

        $data = json_decode($contents, true);
        return is_array($data) ? $data : [];
    }

    /**
     * Write all records to a collection file (atomic via temp + rename).
     */
    public function writeAll(string $name, array $records): void
    {
        $file = $this->filePath($name);
        $dir  = dirname($file);
        $tmp  = $dir . '/.' . $name . '_' . uniqid('', true) . '.tmp';

        $json = json_encode($records, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        // Windows: rename over existing file often fails due to file locks.
        // Use direct write with exclusive lock instead.
        if (PHP_OS_FAMILY === 'Windows') {
            $fp = fopen($file, 'c+');
            if (!$fp) {
                throw new \RuntimeException("Cannot open $file for writing.");
            }
            if (!flock($fp, LOCK_EX)) {
                fclose($fp);
                throw new \RuntimeException("Cannot acquire lock for $file.");
            }
            ftruncate($fp, 0);
            fwrite($fp, $json);
            fflush($fp);
            flock($fp, LOCK_UN);
            fclose($fp);
            return;
        }

        $fp = fopen($tmp, 'w');
        if (!$fp) {
            throw new \RuntimeException("Cannot open temp file for writing.");
        }
        flock($fp, LOCK_EX);
        fwrite($fp, $json);
        fflush($fp);
        flock($fp, LOCK_UN);
        fclose($fp);

        if (!rename($tmp, $file)) {
            @unlink($tmp);
            throw new \RuntimeException("Atomic rename failed for $file.");
        }
    }

    /**
     * Find a single record by id.
     */
    public function findById(string $name, string $id): ?array
    {
        $all = $this->readAll($name);
        foreach ($all as $record) {
            if (($record['id'] ?? null) === $id) {
                return $record;
            }
        }
        return null;
    }

    /**
     * Find records matching a callback.
     */
    public function findWhere(string $name, callable $fn): array
    {
        return array_values(array_filter($this->readAll($name), $fn));
    }

    /**
     * Insert a new record. Throws if id already exists.
     */
    public function insert(string $name, array $record): array
    {
        $all = $this->readAll($name);
        $id  = $record['id'] ?? null;
        if ($id !== null) {
            foreach ($all as $r) {
                if (($r['id'] ?? null) === $id) {
                    throw new \RuntimeException("Record with id $id already exists.");
                }
            }
        }
        $all[] = $record;
        $this->writeAll($name, $all);
        return $record;
    }

    /**
     * Update a record by id. Returns the updated record or null if not found.
     */
    public function update(string $name, string $id, array $changes): ?array
    {
        $all   = $this->readAll($name);
        $found = false;
        $updated = null;
        foreach ($all as &$record) {
            if (($record['id'] ?? null) === $id) {
                $record  = array_merge($record, $changes, ['id' => $id]);
                $updated = $record;
                $found   = true;
                break;
            }
        }
        unset($record);
        if (!$found) {
            return null;
        }
        $this->writeAll($name, $all);
        return $updated;
    }

    /**
     * Delete a record by id. Returns true if deleted.
     */
    public function delete(string $name, string $id): bool
    {
        $all     = $this->readAll($name);
        $before  = count($all);
        $all     = array_values(array_filter($all, fn($r) => ($r['id'] ?? null) !== $id));
        if (count($all) === $before) {
            return false;
        }
        $this->writeAll($name, $all);
        return true;
    }
}
