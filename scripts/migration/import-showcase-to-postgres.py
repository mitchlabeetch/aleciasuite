#!/usr/bin/env python3
# scripts/migration/import-showcase-to-postgres.py
# Imports showcase website data from Convex export JSON files into PostgreSQL
# Handles: team_members, blog_posts, forum_categories, job_offers
# Excludes deprecated fields: quote, education

import json
import subprocess
import os
from datetime import datetime

BACKUP_DIR = "backups/convex_2026-01-22/extracted"
DB_CONTAINER = "alecia-postgres"
DB_USER = "alecia"
DB_NAME = "alecia"

def escape_sql_string(s):
    """Escape a string for SQL."""
    if s is None:
        return "NULL"
    # Replace single quotes with two single quotes
    return s.replace("'", "''")

def escape_sql_array(arr):
    """Convert a list to a PostgreSQL text array."""
    if not arr:
        return "ARRAY[]::text[]"
    # Escape each element and wrap in single quotes
    escaped = [f"'{escape_sql_string(str(x))}'" for x in arr]
    return f"ARRAY[{', '.join(escaped)}]::text[]"

def execute_sql(sql):
    """Execute SQL via docker exec."""
    cmd = [
        "docker", "exec", DB_CONTAINER,
        "psql", "-U", DB_USER, "-d", DB_NAME,
        "-c", sql
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"SQL Error: {result.stderr}")
        return False
    return True

def import_team_members():
    """Import team members from Convex backup."""
    print("Importing team members...")
    file_path = os.path.join(BACKUP_DIR, "team_members/documents.jsonl")
    
    if not os.path.exists(file_path):
        print("  ⚠ File not found: {}".format(file_path))
        return 0
    
    count = 0
    with open(file_path, 'r') as f:
        for line in f:
            if not line.strip():
                continue
            
            data = json.loads(line)
            slug = data.get('slug')
            name = data.get('name')
            
            if not slug or not name:
                continue
            
            # Skip deprecated fields: quote, passion
            bio_fr = escape_sql_string(data.get('bioFr', ''))
            bio_en = escape_sql_string(data.get('bioEn', ''))
            role = escape_sql_string(data.get('role', ''))
            linkedin_url = escape_sql_string(data.get('linkedinUrl', ''))
            email = escape_sql_string(data.get('email', ''))
            is_active = data.get('isActive', True)
            display_order = data.get('displayOrder', 0)
            
            sectors_expertise = escape_sql_array(data.get('sectorsExpertise', []))
            transaction_slugs = escape_sql_array(data.get('transactionSlugs', []))
            
            sql = f"""
                INSERT INTO shared.team_members (
                    slug, name, role, bio_fr, bio_en, linkedin_url, email,
                    sectors_expertise, transaction_slugs, is_active, display_order, created_at, updated_at
                )
                VALUES (
                    '{slug}',
                    '{escape_sql_string(name)}',
                    '{role}',
                    E'{bio_fr}',
                    E'{bio_en}',
                    '{linkedin_url}',
                    '{email}',
                    {sectors_expertise},
                    {transaction_slugs},
                    {str(is_active).lower()},
                    {display_order},
                    NOW(),
                    NOW()
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
            """
            
            if execute_sql(sql):
                count += 1
    
    print(f"✓ Imported {count} team members")
    return count

def import_blog_posts():
    """Import blog posts from Convex backup."""
    print("Importing blog posts...")
    file_path = os.path.join(BACKUP_DIR, "blog_posts/documents.jsonl")
    
    if not os.path.exists(file_path):
        print("  ⚠ File not found: {}".format(file_path))
        return 0
    
    count = 0
    with open(file_path, 'r') as f:
        for line in f:
            if not line.strip():
                continue
            
            data = json.loads(line)
            slug = data.get('slug')
            title = data.get('title')
            
            if not slug or not title:
                continue
            
            content = escape_sql_string(data.get('content', ''))
            excerpt = escape_sql_string(data.get('excerpt', ''))
            category = escape_sql_string(data.get('category', ''))
            cover_image = escape_sql_string(data.get('coverImage', ''))
            status = data.get('status', 'published')
            
            # Convert published_at from milliseconds to bigint (seconds)
            published_at = data.get('publishedAt')
            if published_at and published_at != "null":
                published_at_pg = str(int(published_at / 1000))
            else:
                published_at_pg = "NULL"
            
            # Convert created_at from milliseconds to bigint (seconds)
            created_at = data.get('_creationTime')
            if created_at:
                created_at_pg = str(int(created_at / 1000))
            else:
                created_at_pg = str(int(datetime.now().timestamp()))
            
            seo_title = escape_sql_string(data.get('seoTitle', ''))
            seo_description = escape_sql_string(data.get('seoDescription', ''))
            
            sql = f"""
                INSERT INTO shared.blog_posts (
                    status, title, slug, content, excerpt, featured_image, category,
                    published_at, seo, tags, created_at
                )
                VALUES (
                    '{status}',
                    '{escape_sql_string(title)}',
                    '{slug}',
                    E'{content}',
                    E'{excerpt}',
                    '{cover_image}',
                    '{category}',
                    {published_at_pg},
                    '{{"title": "{seo_title}", "description": "{seo_description}"}}'::jsonb,
                    '{{}}'::text[],
                    {created_at_pg}
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
            """
            
            if execute_sql(sql):
                count += 1
    
    print(f"✓ Imported {count} blog posts")
    return count

def import_forum_categories():
    """Import forum categories from Convex backup."""
    print("Importing forum categories...")
    file_path = os.path.join(BACKUP_DIR, "forum_categories/documents.jsonl")
    
    if not os.path.exists(file_path):
        print("  ⚠ File not found: {}".format(file_path))
        return 0
    
    count = 0
    with open(file_path, 'r') as f:
        for line in f:
            if not line.strip():
                continue
            
            data = json.loads(line)
            name = data.get('name')
            
            if not name:
                continue
            
            description = escape_sql_string(data.get('description', ''))
            is_private = data.get('isPrivate', False)
            order = data.get('order', 0)
            
            sql = f"""
                INSERT INTO shared.forum_categories (
                    name, description, is_private, "order", created_at
                )
                VALUES (
                    '{escape_sql_string(name)}',
                    E'{description}',
                    {str(is_private).lower()},
                    {order},
                    NOW()
                )
                ON CONFLICT DO NOTHING;
            """
            
            if execute_sql(sql):
                count += 1
    
    print(f"✓ Imported {count} forum categories")
    return count

def import_job_offers():
    """Import job offers from Convex backup."""
    print("Importing job offers...")
    file_path = os.path.join(BACKUP_DIR, "job_offers/documents.jsonl")
    
    if not os.path.exists(file_path):
        print("  ⚠ File not found: {}".format(file_path))
        return 0
    
    count = 0
    with open(file_path, 'r') as f:
        for line in f:
            if not line.strip():
                continue
            
            data = json.loads(line)
            slug = data.get('slug')
            title = data.get('title')
            
            if not slug or not title:
                continue
            
            type_val = escape_sql_string(data.get('type', ''))
            location = escape_sql_string(data.get('location', ''))
            description = escape_sql_string(data.get('description', ''))
            contact_email = escape_sql_string(data.get('contactEmail', ''))
            pdf_url = escape_sql_string(data.get('pdfUrl', ''))
            is_published = data.get('isPublished', False)
            display_order = data.get('displayOrder', 0)
            
            requirements = escape_sql_array(data.get('requirements', []))
            
            sql = f"""
                INSERT INTO shared.job_offers (
                    slug, title, type, location, description, requirements,
                    contact_email, pdf_url, is_published, display_order, created_at, updated_at
                )
                VALUES (
                    '{slug}',
                    '{escape_sql_string(title)}',
                    '{type_val}',
                    '{location}',
                    E'{description}',
                    {requirements},
                    '{contact_email}',
                    '{pdf_url}',
                    {str(is_published).lower()},
                    {display_order},
                    NOW(),
                    NOW()
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
            """
            
            if execute_sql(sql):
                count += 1
    
    print(f"✓ Imported {count} job offers")
    return count

def main():
    """Main function."""
    print("=== Alecia Showcase Website Import to PostgreSQL ===")
    print("Excluding deprecated fields: quote, education")
    print()
    
    # Check if database container is running
    result = subprocess.run(
        ["docker", "ps", "--filter", f"name={DB_CONTAINER}", "--format", "{{.Names}}"],
        capture_output=True, text=True
    )
    
    if DB_CONTAINER not in result.stdout:
        print(f"Error: Database container '{DB_CONTAINER}' is not running.")
        return 1
    
    # Import in order (no FK dependencies between these tables)
    import_team_members()
    import_blog_posts()
    import_forum_categories()
    import_job_offers()
    
    print()
    print("=== Showcase website import complete ===")
    return 0

if __name__ == "__main__":
    exit(main())
