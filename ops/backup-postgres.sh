#!/bin/sh

set -eu

ENV_FILE="${ENV_FILE:-/etc/forked-nuces/production.env}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/forked-nuces}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
BACKUP_MIRROR_DIR="${BACKUP_MIRROR_DIR:-}"

case "$BACKUP_DIR" in
    /*) ;;
    *) echo "BACKUP_DIR must be an absolute path" >&2; exit 2 ;;
esac
if [ "$BACKUP_DIR" = "/" ]; then
    echo "BACKUP_DIR cannot be the filesystem root" >&2
    exit 2
fi
case "$BACKUP_RETENTION_DAYS" in
    ''|*[!0-9]*) echo "BACKUP_RETENTION_DAYS must be a positive integer" >&2; exit 2 ;;
esac
if [ "$BACKUP_RETENTION_DAYS" -lt 1 ]; then
    echo "BACKUP_RETENTION_DAYS must be at least 1" >&2
    exit 2
fi
if [ ! -r "$ENV_FILE" ]; then
    echo "Cannot read production environment file: $ENV_FILE" >&2
    exit 2
fi

umask 077
mkdir -p "$BACKUP_DIR"

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
name="forked-nuces-${timestamp}.dump"
temporary="$BACKUP_DIR/.${name}.tmp"
archive="$BACKUP_DIR/$name"
checksum="$archive.sha256"

cleanup() {
    rm -f "$temporary"
}
trap cleanup EXIT HUP INT TERM

docker compose --env-file "$ENV_FILE" exec -T db sh -c \
    'exec pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom --compress=9' \
    > "$temporary"

if [ ! -s "$temporary" ]; then
    echo "Database backup was empty" >&2
    exit 1
fi

# Parsing the archive proves that pg_dump produced a structurally readable
# custom-format file before it is promoted or copied elsewhere.
docker compose --env-file "$ENV_FILE" exec -T db pg_restore --list \
    < "$temporary" > /dev/null

mv "$temporary" "$archive"
(
    cd "$BACKUP_DIR"
    sha256sum "$name" > "${name}.sha256"
    sha256sum --check "${name}.sha256" > /dev/null
)

if [ -n "$BACKUP_MIRROR_DIR" ]; then
    case "$BACKUP_MIRROR_DIR" in
        /*) ;;
        *) echo "BACKUP_MIRROR_DIR must be an absolute path" >&2; exit 2 ;;
    esac
    if [ ! -d "$BACKUP_MIRROR_DIR" ]; then
        echo "BACKUP_MIRROR_DIR must already exist (mount off-host storage there)" >&2
        exit 2
    fi
    if [ "$(realpath "$BACKUP_MIRROR_DIR")" = "$(realpath "$BACKUP_DIR")" ]; then
        echo "BACKUP_MIRROR_DIR must differ from BACKUP_DIR" >&2
        exit 2
    fi

    mirror_tmp="$BACKUP_MIRROR_DIR/.${name}.tmp"
    cp "$archive" "$mirror_tmp"
    mv "$mirror_tmp" "$BACKUP_MIRROR_DIR/$name"
    cp "$checksum" "$BACKUP_MIRROR_DIR/${name}.sha256.tmp"
    mv "$BACKUP_MIRROR_DIR/${name}.sha256.tmp" \
        "$BACKUP_MIRROR_DIR/${name}.sha256"
fi

find "$BACKUP_DIR" -maxdepth 1 -type f \
    \( -name 'forked-nuces-*.dump' -o -name 'forked-nuces-*.dump.sha256' \) \
    -mtime "+$BACKUP_RETENTION_DAYS" -delete

if [ -n "$BACKUP_MIRROR_DIR" ]; then
    find "$BACKUP_MIRROR_DIR" -maxdepth 1 -type f \
        \( -name 'forked-nuces-*.dump' -o -name 'forked-nuces-*.dump.sha256' \) \
        -mtime "+$BACKUP_RETENTION_DAYS" -delete
fi

echo "Created and verified $archive"
