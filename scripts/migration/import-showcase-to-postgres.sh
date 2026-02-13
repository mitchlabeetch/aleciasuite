#!/bin/bash
# scripts/migration/import-showcase-to-postgres.sh
# Imports showcase website data from Convex export JSON files into PostgreSQL
# Handles: team_members, blog_posts, forum_categories, job_offers
# Excludes deprecated fields: quote, education

set -e

BACKUP_DIR="backups/convex_2026-01-22/extracted"
DB_CONTAINER="alecia-postgres"
DB_USER="alecia"
DB_NAME="alecia"

echo "=== Alecia Showcase Website Import to PostgreSQL ==="
echo "Excluding deprecated fields: quote, education"
echo ""

# Function to generate UUID
generate_uuid() {
    docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT gen_random_uuid()::text" | tr -d '[:space:]'
}

# ============================================================================
# Team Members
# ============================================================================
import_team_members() {
    echo "Importing team members..."
    local file="$BACKUP_DIR/team_members/documents.jsonl"

    if [ ! -f "$file" ]; then
        echo "  ⚠ File not found: $file"
        return
    fi

    local count=0
    while IFS= read -r line; do
        if [ -z "$line" ]; then continue; fi

        # Extract fields using jq
        local slug=$(echo "$line" | jq -r '.slug // empty')
        local name=$(echo "$line" | jq -r '.name // empty')
        local role=$(echo "$line" | jq -r '.role // empty')
        local bio_fr=$(echo "$line" | jq -r '.bioFr // empty' | sed "s/'/''/g")
        local bio_en=$(echo "$line" | jq -r '.bioEn // empty' | sed "s/'/''/g")
        local linkedin_url=$(echo "$line" | jq -r '.linkedinUrl // empty')
        local email=$(echo "$line" | jq -r '.email // empty')
        local is_active=$(echo "$line" | jq -r '.isActive // true')
        local display_order=$(echo "$line" | jq -r '.displayOrder // 0')
        local creation_time=$(echo "$line" | jq -r '._creationTime // 0')

        # Skip deprecated fields: quote, passion
        # Convert timestamp to PostgreSQL format
        local created_at=$(date -d "@$(echo "$creation_time" | cut -d'.' -f1)" -u +"%Y-%m-%d %H:%M:%S" 2>/dev/null || echo "NOW()")

        # Get sectors_expertise and transaction_slugs as arrays
        local sectors_expertise=$(echo "$line" | jq -c '.sectorsExpertise // []' | sed "s/'/''/g")
        local transaction_slugs=$(echo "$line" | jq -c '.transactionSlugs // []' | sed "s/'/''/g")

        if [ -n "$slug" ] && [ -n "$name" ]; then
            docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "
                INSERT INTO shared.team_members (
                    id, slug, name, role, photo, photo_url, bio_fr, bio_en,
                    linkedin_url, email, sectors_expertise, transaction_slugs,
                    is_active, display_order, created_at, updated_at
                )
                VALUES (
                    gen_random_uuid(),
                    '$slug',
                    '$(echo "$name" | sed "s/'/''/g")',
                    '$(echo "$role" | sed "s/'/''/g")',
                    NULL,
                    NULL,
                    '$bio_fr',
                    '$bio_en',
                    '$linkedin_url',
                    '$email',
                    '$sectors_expertise'::jsonb,
                    '$transaction_slugs'::jsonb,
                    $is_active,
                    $display_order,
                    '$created_at',
                    '$created_at'
                )
                ON CONFLICT (slug) DO UPDATE SET
                    name = EXCLUDED.name,
                    role = EXCLUDED.role,
                    bio_fr = EXCLUDED.bio_fr,
                    bio_en = EXCLUDED.bio_en,
                    linkedin_url = EXCLUDED.linkedin_url,
                    email = EXCLUDED.email,
                    sectors_expertise = EXCLUDED.sectors_expertise,
                    transaction_slugs = EXCLUDED.transaction_slugs,
                    is_active = EXCLUDED.is_active,
                    display_order = EXCLUDED.display_order,
                    updated_at = NOW();
            " > /dev/null 2>&1
            ((count++))
        fi
    done < "$file"

    echo "✓ Imported $count team members"
}

# ============================================================================
# Blog Posts
# ============================================================================
import_blog_posts() {
    echo "Importing blog posts..."
    local file="$BACKUP_DIR/blog_posts/documents.jsonl"

    if [ ! -f "$file" ]; then
        echo "  ⚠ File not found: $file"
        return
    fi

    local count=0
    while IFS= read -r line; do
        if [ -z "$line" ]; then continue; fi

        local slug=$(echo "$line" | jq -r '.slug // empty')
        local title=$(echo "$line" | jq -r '.title // empty')
        local content=$(echo "$line" | jq -r '.content // empty' | sed "s/'/''/g")
        local excerpt=$(echo "$line" | jq -r '.excerpt // empty' | sed "s/'/''/g")
        local category=$(echo "$line" | jq -r '.category // empty')
        local cover_image=$(echo "$line" | jq -r '.coverImage // empty')
        local status=$(echo "$line" | jq -r '.status // "published"')
        local published_at=$(echo "$line" | jq -r '.publishedAt // empty')
        local seo_title=$(echo "$line" | jq -r '.seoTitle // empty' | sed "s/'/''/g")
        local seo_description=$(echo "$line" | jq -r '.seoDescription // empty' | sed "s/'/''/g")
        local creation_time=$(echo "$line" | jq -r '._creationTime // 0')

        # Convert timestamps
        local created_at=$(date -d "@$(echo "$creation_time" | cut -d'.' -f1)" -u +"%Y-%m-%d %H:%M:%S" 2>/dev/null || echo "NOW()")
        local published_at_pg=""
        if [ -n "$published_at" ] && [ "$published_at" != "null" ]; then
            published_at_pg=$(date -d "@$(echo "$published_at" | cut -d'.' -f1)" -u +"%Y-%m-%d %H:%M:%S" 2>/dev/null || echo "NULL")
        else
            published_at_pg="NULL"
        fi

        if [ -n "$slug" ] && [ -n "$title" ]; then
            docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "
                INSERT INTO shared.blog_posts (
                    id, status, author_id, title, slug, content, excerpt,
                    featured_image, category, published_at, seo, tags, created_at
                )
                VALUES (
                    gen_random_uuid(),
                    '$status',
                    NULL,
                    '$(echo "$title" | sed "s/'/''/g")',
                    '$slug',
                    '$content',
                    '$excerpt',
                    '$cover_image',
                    '$category',
                    $published_at_pg,
                    '{\"title\": \"$seo_title\", \"description\": \"$seo_description\"}'::jsonb,
                    '{}'::text[],
                    '$created_at'
                )
                ON CONFLICT (slug) DO UPDATE SET
                    title = EXCLUDED.title,
                    content = EXCLUDED.content,
                    excerpt = EXCLUDED.excerpt,
                    featured_image = EXCLUDED.featured_image,
                    category = EXCLUDED.category,
                    published_at = EXCLUDED.published_at,
                    seo = EXCLUDED.seo,
                    tags = EXCLUDED.tags;
            " > /dev/null 2>&1
            ((count++))
        fi
    done < "$file"

    echo "✓ Imported $count blog posts"
}

# ============================================================================
# Forum Categories
# ============================================================================
import_forum_categories() {
    echo "Importing forum categories..."
    local file="$BACKUP_DIR/forum_categories/documents.jsonl"

    if [ ! -f "$file" ]; then
        echo "  ⚠ File not found: $file"
        return
    fi

    local count=0
    while IFS= read -r line; do
        if [ -z "$line" ]; then continue; fi

        local name=$(echo "$line" | jq -r '.name // empty')
        local description=$(echo "$line" | jq -r '.description // empty' | sed "s/'/''/g")
        local is_private=$(echo "$line" | jq -r '.isPrivate // false')
        local order=$(echo "$line" | jq -r '.order // 0')
        local creation_time=$(echo "$line" | jq -r '._creationTime // 0')

        local created_at=$(date -d "@$(echo "$creation_time" | cut -d'.' -f1)" -u +"%Y-%m-%d %H:%M:%S" 2>/dev/null || echo "NOW()")

        if [ -n "$name" ]; then
            docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "
                INSERT INTO shared.forum_categories (
                    id, name, description, is_private, \"order\", created_at
                )
                VALUES (
                    gen_random_uuid(),
                    '$(echo "$name" | sed "s/'/''/g")',
                    '$description',
                    $is_private,
                    $order,
                    '$created_at'
                )
                ON CONFLICT DO NOTHING;
            " > /dev/null 2>&1
            ((count++))
        fi
    done < "$file"

    echo "✓ Imported $count forum categories"
}

# ============================================================================
# Job Offers
# ============================================================================
import_job_offers() {
    echo "Importing job offers..."
    local file="$BACKUP_DIR/job_offers/documents.jsonl"

    if [ ! -f "$file" ]; then
        echo "  ⚠ File not found: $file"
        return
    fi

    local count=0
    while IFS= read -r line; do
        if [ -z "$line" ]; then continue; fi

        local slug=$(echo "$line" | jq -r '.slug // empty')
        local title=$(echo "$line" | jq -r '.title // empty')
        local type=$(echo "$line" | jq -r '.type // empty')
        local location=$(echo "$line" | jq -r '.location // empty')
        local description=$(echo "$line" | jq -r '.description // empty' | sed "s/'/''/g")
        local contact_email=$(echo "$line" | jq -r '.contactEmail // empty')
        local pdf_url=$(echo "$line" | jq -r '.pdfUrl // empty')
        local is_published=$(echo "$line" | jq -r '.isPublished // false')
        local display_order=$(echo "$line" | jq -r '.displayOrder // 0')
        local creation_time=$(echo "$line" | jq -r '._creationTime // 0')

        # Get requirements as array
        local requirements=$(echo "$line" | jq -c '.requirements // []' | sed "s/'/''/g")

        local created_at=$(date -d "@$(echo "$creation_time" | cut -d'.' -f1)" -u +"%Y-%m-%d %H:%M:%S" 2>/dev/null || echo "NOW()")

        if [ -n "$slug" ] && [ -n "$title" ]; then
            docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "
                INSERT INTO shared.job_offers (
                    id, slug, title, type, location, description, requirements,
                    contact_email, pdf_url, is_published, display_order, created_at, updated_at
                )
                VALUES (
                    gen_random_uuid(),
                    '$slug',
                    '$(echo "$title" | sed "s/'/''/g")',
                    '$type',
                    '$location',
                    '$description',
                    '$requirements'::jsonb,
                    '$contact_email',
                    '$pdf_url',
                    $is_published,
                    $display_order,
                    '$created_at',
                    '$created_at'
                )
                ON CONFLICT (slug) DO UPDATE SET
                    title = EXCLUDED.title,
                    type = EXCLUDED.type,
                    location = EXCLUDED.location,
                    description = EXCLUDED.description,
                    requirements = EXCLUDED.requirements,
                    contact_email = EXCLUDED.contact_email,
                    pdf_url = EXCLUDED.pdf_url,
                    is_published = EXCLUDED.is_published,
                    display_order = EXCLUDED.display_order,
                    updated_at = NOW();
            " > /dev/null 2>&1
            ((count++))
        fi
    done < "$file"

    echo "✓ Imported $count job offers"
}

# ============================================================================
# Main
# ============================================================================
main() {
    # Check if jq is installed
    if ! command -v jq &> /dev/null; then
        echo "Error: jq is required but not installed."
        echo "Install with: sudo apt-get install jq"
        exit 1
    fi

    # Check if database container is running
    if ! docker ps | grep -q "$DB_CONTAINER"; then
        echo "Error: Database container '$DB_CONTAINER' is not running."
        exit 1
    fi

    # Import in order (no FK dependencies between these tables)
    import_team_members
    import_blog_posts
    import_forum_categories
    import_job_offers

    echo ""
    echo "=== Showcase website import complete ==="
}

main
