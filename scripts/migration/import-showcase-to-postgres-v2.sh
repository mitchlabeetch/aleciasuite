#!/bin/bash
# scripts/migration/import-showcase-to-postgres-v2.sh
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

    # Create a temporary SQL file
    local sql_file="/tmp/team_members_import.sql"
    echo "-- Team Members Import" > "$sql_file"

    local count=0
    while IFS= read -r line; do
        if [ -z "$line" ]; then continue; fi

        # Extract fields using jq
        local slug=$(echo "$line" | jq -r '.slug // empty')
        local name=$(echo "$line" | jq -r '.name // empty')
        local role=$(echo "$line" | jq -r '.role // empty')
        local bio_fr=$(echo "$line" | jq -r '.bioFr // ""' | sed "s/'/''/g")
        local bio_en=$(echo "$line" | jq -r '.bioEn // ""' | sed "s/'/''/g")
        local linkedin_url=$(echo "$line" | jq -r '.linkedinUrl // ""')
        local email=$(echo "$line" | jq -r '.email // ""')
        local is_active=$(echo "$line" | jq -r '.isActive // true')
        local display_order=$(echo "$line" | jq -r '.displayOrder // 0')

        # Skip deprecated fields: quote, passion
        # Get sectors_expertise and transaction_slugs as PostgreSQL text arrays
        local sectors_expertise=$(echo "$line" | jq -r '.sectorsExpertise // [] | @csv' | sed 's/^"\(.*\)"$/\1/' | sed "s/', '/','/g" | sed "s/'/''/g")
        local transaction_slugs=$(echo "$line" | jq -r '.transactionSlugs // [] | @csv' | sed 's/^"\(.*\)"$/\1/' | sed "s/', '/','/g" | sed "s/'/''/g")

        if [ -n "$slug" ] && [ -n "$name" ]; then
            echo "INSERT INTO shared.team_members (slug, name, role, bio_fr, bio_en, linkedin_url, email, sectors_expertise, transaction_slugs, is_active, display_order, created_at, updated_at)" >> "$sql_file"
            echo "VALUES ('$slug', '$(echo "$name" | sed "s/'/''/g")', '$(echo "$role" | sed "s/'/''/g")', E'$bio_fr', E'$bio_en', '$linkedin_url', '$email', ARRAY[$sectors_expertise]::text[], ARRAY[$transaction_slugs]::text[], $is_active, $display_order, NOW(), NOW())" >> "$sql_file"
            echo "ON CONFLICT (slug) DO UPDATE SET" >> "$sql_file"
            echo "  name = EXCLUDED.name," >> "$sql_file"
            echo "  role = EXCLUDED.role," >> "$sql_file"
            echo "  bio_fr = EXCLUDED.bio_fr," >> "$sql_file"
            echo "  bio_en = EXCLUDED.bio_en," >> "$sql_file"
            echo "  linkedin_url = EXCLUDED.linkedin_url," >> "$sql_file"
            echo "  email = EXCLUDED.email," >> "$sql_file"
            echo "  sectors_expertise = EXCLUDED.sectors_expertise," >> "$sql_file"
            echo "  transaction_slugs = EXCLUDED.transaction_slugs," >> "$sql_file"
            echo "  is_active = EXCLUDED.is_active," >> "$sql_file"
            echo "  display_order = EXCLUDED.display_order," >> "$sql_file"
            echo "  updated_at = NOW();" >> "$sql_file"
            echo "" >> "$sql_file"
            ((count++))
        fi
    done < "$file"

    # Execute the SQL file
    if [ $count -gt 0 ]; then
        docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" < "$sql_file" > /dev/null 2>&1
        echo "✓ Imported $count team members"
    else
        echo "✓ No team members to import"
    fi

    rm -f "$sql_file"
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

    local sql_file="/tmp/blog_posts_import.sql"
    echo "-- Blog Posts Import" > "$sql_file"

    local count=0
    while IFS= read -r line; do
        if [ -z "$line" ]; then continue; fi

        local slug=$(echo "$line" | jq -r '.slug // empty')
        local title=$(echo "$line" | jq -r '.title // empty')
        local content=$(echo "$line" | jq -r '.content // ""' | sed "s/'/''/g")
        local excerpt=$(echo "$line" | jq -r '.excerpt // ""' | sed "s/'/''/g")
        local category=$(echo "$line" | jq -r '.category // ""')
        local cover_image=$(echo "$line" | jq -r '.coverImage // ""')
        local status=$(echo "$line" | jq -r '.status // "published"')
        local published_at=$(echo "$line" | jq -r '.publishedAt // empty')
        local seo_title=$(echo "$line" | jq -r '.seoTitle // ""' | sed "s/'/''/g")
        local seo_description=$(echo "$line" | jq -r '.seoDescription // ""' | sed "s/'/''/g")
        local creation_time=$(echo "$line" | jq -r '._creationTime // 0')

        # Convert timestamps
        local created_at=$(date -d "@$(echo "$creation_time" | cut -d'.' -f1)" -u +"%Y-%m-%d %H:%M:%S" 2>/dev/null || echo "NOW()")
        local published_at_pg="NULL"
        if [ -n "$published_at" ] && [ "$published_at" != "null" ]; then
            published_at_pg=$(date -d "@$(echo "$published_at" | cut -d'.' -f1)" -u +"%Y-%m-%d %H:%M:%S" 2>/dev/null || echo "NULL")
        fi

        if [ -n "$slug" ] && [ -n "$title" ]; then
            echo "INSERT INTO shared.blog_posts (status, title, slug, content, excerpt, featured_image, category, published_at, seo, tags, created_at)" >> "$sql_file"
            echo "VALUES ('$status', '$(echo "$title" | sed "s/'/''/g")', '$slug', E'$content', E'$excerpt', '$cover_image', '$category', $published_at_pg, '{\"title\": \"$seo_title\", \"description\": \"$seo_description\"}'::jsonb, '{}'::text[], '$created_at')" >> "$sql_file"
            echo "ON CONFLICT (slug) DO UPDATE SET" >> "$sql_file"
            echo "  title = EXCLUDED.title," >> "$sql_file"
            echo "  content = EXCLUDED.content," >> "$sql_file"
            echo "  excerpt = EXCLUDED.excerpt," >> "$sql_file"
            echo "  featured_image = EXCLUDED.featured_image," >> "$sql_file"
            echo "  category = EXCLUDED.category," >> "$sql_file"
            echo "  published_at = EXCLUDED.published_at," >> "$sql_file"
            echo "  seo = EXCLUDED.seo," >> "$sql_file"
            echo "  tags = EXCLUDED.tags;" >> "$sql_file"
            echo "" >> "$sql_file"
            ((count++))
        fi
    done < "$file"

    if [ $count -gt 0 ]; then
        docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" < "$sql_file" > /dev/null 2>&1
        echo "✓ Imported $count blog posts"
    else
        echo "✓ No blog posts to import"
    fi

    rm -f "$sql_file"
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

    local sql_file="/tmp/forum_categories_import.sql"
    echo "-- Forum Categories Import" > "$sql_file"

    local count=0
    while IFS= read -r line; do
        if [ -z "$line" ]; then continue; fi

        local name=$(echo "$line" | jq -r '.name // empty')
        local description=$(echo "$line" | jq -r '.description // ""' | sed "s/'/''/g")
        local is_private=$(echo "$line" | jq -r '.isPrivate // false')
        local order=$(echo "$line" | jq -r '.order // 0')

        if [ -n "$name" ]; then
            echo "INSERT INTO shared.forum_categories (name, description, is_private, \"order\", created_at)" >> "$sql_file"
            echo "VALUES ('$(echo "$name" | sed "s/'/''/g")', E'$description', $is_private, $order, NOW())" >> "$sql_file"
            echo "ON CONFLICT DO NOTHING;" >> "$sql_file"
            echo "" >> "$sql_file"
            ((count++))
        fi
    done < "$file"

    if [ $count -gt 0 ]; then
        docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" < "$sql_file" > /dev/null 2>&1
        echo "✓ Imported $count forum categories"
    else
        echo "✓ No forum categories to import"
    fi

    rm -f "$sql_file"
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

    local sql_file="/tmp/job_offers_import.sql"
    echo "-- Job Offers Import" > "$sql_file"

    local count=0
    while IFS= read -r line; do
        if [ -z "$line" ]; then continue; fi

        local slug=$(echo "$line" | jq -r '.slug // empty')
        local title=$(echo "$line" | jq -r '.title // empty')
        local type=$(echo "$line" | jq -r '.type // ""')
        local location=$(echo "$line" | jq -r '.location // ""')
        local description=$(echo "$line" | jq -r '.description // ""' | sed "s/'/''/g")
        local contact_email=$(echo "$line" | jq -r '.contactEmail // ""')
        local pdf_url=$(echo "$line" | jq -r '.pdfUrl // ""')
        local is_published=$(echo "$line" | jq -r '.isPublished // false')
        local display_order=$(echo "$line" | jq -r '.displayOrder // 0')

        # Get requirements as PostgreSQL text array
        local requirements=$(echo "$line" | jq -r '.requirements // [] | @csv' | sed 's/^"\(.*\)"$/\1/' | sed "s/', '/','/g" | sed "s/'/''/g")

        if [ -n "$slug" ] && [ -n "$title" ]; then
            echo "INSERT INTO shared.job_offers (slug, title, type, location, description, requirements, contact_email, pdf_url, is_published, display_order, created_at, updated_at)" >> "$sql_file"
            echo "VALUES ('$slug', '$(echo "$title" | sed "s/'/''/g")', '$type', '$location', E'$description', ARRAY[$requirements]::text[], '$contact_email', '$pdf_url', $is_published, $display_order, NOW(), NOW())" >> "$sql_file"
            echo "ON CONFLICT (slug) DO UPDATE SET" >> "$sql_file"
            echo "  title = EXCLUDED.title," >> "$sql_file"
            echo "  type = EXCLUDED.type," >> "$sql_file"
            echo "  location = EXCLUDED.location," >> "$sql_file"
            echo "  description = EXCLUDED.description," >> "$sql_file"
            echo "  requirements = EXCLUDED.requirements," >> "$sql_file"
            echo "  contact_email = EXCLUDED.contact_email," >> "$sql_file"
            echo "  pdf_url = EXCLUDED.pdf_url," >> "$sql_file"
            echo "  is_published = EXCLUDED.is_published," >> "$sql_file"
            echo "  display_order = EXCLUDED.display_order," >> "$sql_file"
            echo "  updated_at = NOW();" >> "$sql_file"
            echo "" >> "$sql_file"
            ((count++))
        fi
    done < "$file"

    if [ $count -gt 0 ]; then
        docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" < "$sql_file" > /dev/null 2>&1
        echo "✓ Imported $count job offers"
    else
        echo "✓ No job offers to import"
    fi

    rm -f "$sql_file"
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
