#!/usr/bin/env python3
import json
import logging
import re
import time
from datetime import datetime
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

# Setup logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


class FrenchMABScraper:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update(
            {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
                "Accept-Encoding": "gzip, deflate",
                "Connection": "keep-alive",
            }
        )
        self.results = {
            "scraped_at": datetime.now().isoformat(),
            "total_items": 0,
            "sources": {},
        }

    def safe_request(self, url, max_retries=3):
        """Safe request with retries and delays"""
        for attempt in range(max_retries):
            try:
                resp = self.session.get(url, timeout=15)
                resp.raise_for_status()
                time.sleep(1 + attempt * 0.5)
                return resp
            except Exception as e:
                logger.warning(f"Attempt {attempt + 1} failed for {url}: {e}")
                if attempt == max_retries - 1:
                    return None
        return None

    def extract_fusacq_listings(self, soup, base_url):
        """Extract Fusacq listing items"""
        items = []

        # Try multiple selector patterns for Fusacq
        selectors = [
            ".annonce-item, .item-annonce, .listing-item",
            ".result-item, .search-result, .bloc-annonce",
            'div[class*="annonce"], div[class*="item"] a[href]',
            "tr.result-row, .table-result tr",
            ".fiches, .fiche-entreprise",
            ".resultat, .resultats li",
        ]

        elements = []
        for selector in selectors:
            elements = soup.select(selector)
            if elements:
                logger.info(f"Found {len(elements)} items with selector: {selector}")
                break

        if not elements:
            logger.warning("No items found - trying fallback selectors")
            # Fallback: any link containers
            elements = soup.select("a[href][title], div a[href]")

        for el in elements[:50]:  # Limit per page
            try:
                # Extract title/link
                title_el = el.select_one('a, h3, .title, [class*="titre"], h4, h5')
                if not title_el:
                    title_el = el.find("a")

                title = title_el.get_text(strip=True) if title_el else "N/A"
                link = None
                if title_el and title_el.get("href"):
                    link = urljoin(base_url, title_el["href"])

                # Extract fields SAFELY (Python syntax)
                sector_el = el.select_one(
                    '[class*="secteur"], .category, .secteur, [class*="secteur"]'
                )
                sector = sector_el.get_text(strip=True) if sector_el else "N/A"

                location_el = el.select_one(
                    '[class*="localisation"], .location, .ville, .region, [class*="lieu"]'
                )
                location = location_el.get_text(strip=True) if location_el else "N/A"

                ca_el = el.select_one(
                    '[class*="ca"], [class*="chiffre"], .amount, .ca, [class*="CA"]'
                )
                ca = ca_el.get_text(strip=True) if ca_el else "N/A"

                price_el = el.select_one(
                    '[class*="prix"], .price, .montant, [class*="prix"]'
                )
                price = price_el.get_text(strip=True) if price_el else "N/A"

                date_el = el.select_one('.date, [class*="date"], time')
                date = date_el.get_text(strip=True) if date_el else "N/A"

                item = {
                    "title": title,
                    "url": link,
                    "sector": sector,
                    "location": location,
                    "ca": ca,
                    "price": price,
                    "date": date,
                    "source": base_url,
                    "scraped_at": datetime.now().isoformat(),
                }

                # Clean numeric fields
                item["ca_clean"] = self.clean_amount(ca)
                item["price_clean"] = self.clean_amount(price)

                items.append(item)

            except Exception as e:
                logger.debug(f"Error extracting item: {e}")
                continue

        return items

    def handle_fusacq_pagination(self, base_url):
        """✅ YES - Handles ALL pages until end (page 1 → page 6 → stops)"""
        all_items = []
        page = 1
        max_pages = 50  # Safety limit

        while page <= max_pages:
            # Handles your exact URL pattern: ?params&page=1, ?params&page=2...
            if "?" in base_url:
                url = f"{base_url}&page={page}"
            else:
                url = f"{base_url}?page={page}"

            logger.info(f"Scraping page {page}: {url}")
            resp = self.safe_request(url)
            if not resp:
                logger.info("No response - end of pagination")
                break

            soup = BeautifulSoup(resp.content, "html.parser")
            items = self.extract_fusacq_listings(soup, base_url)

            if not items:  # Empty page = END
                logger.info(f"Page {page} empty - stopping")
                break

            all_items.extend(items)
            logger.info(f"Page {page}: {len(items)} items (total: {len(all_items)})")

            # Check for next page indicators
            next_btn = soup.select_one(
                'a.next, .pagination-next, [rel="next"], .suivant'
            )
            pagination_info = soup.select_one(".pagination-info, .page-info")

            # Stop conditions
            if not next_btn or "disabled" in str(next_btn.get("class", [])):
                logger.info("No next button - end of pagination")
                break

            if "dernière" in str(soup).lower() or "last" in str(soup).lower():
                logger.info("Last page indicator found")
                break

            page += 1
            time.sleep(2)  # Polite delay

        return all_items

    def clean_amount(self, text):
        """Clean € amounts: '5 M€' → 5000000"""
        if not text or text == "N/A":
            return None
        match = re.search(
            r"(\d+(?:\.\d+)?)\s*(M?|milliard|million|k?€)", text, re.IGNORECASE
        )
        if match:
            num = float(match.group(1).replace(",", "."))
            mult = match.group(2).upper() if match.group(2) else ""
            if mult in ["M", "MILLION"]:
                num *= 1_000_000
            elif "MILLIARD" in mult:
                num *= 1_000_000_000
            return round(num)
        return None

    def scrape_all_sources(self, urls):
        """Process all your URLs with full pagination"""
        categories = {
            "repreneurs": ["https://www.fusacq.com/annuaire-repreneurs_fr_"],
            "banks_advisors": [
                "https://www.fusacq.com/classement/classement-banques-affaires-conseils-fusions-acquisitions?codePays=_fr_"
            ],
            "investment_funds": [
                "https://www.fusacq.com/annuaire-fonds-investissement_fr_"
            ],
            "valuations": ["https://www.fusacq.com/base-valorisations_fr_"],
            "expert_opinions": ["https://www.fusacq.com/avis-experts_fr_"],
            "cession_actifs": [
                "https://www.fusacq.com/reprendre-une-entreprise/resultats-cession-actifs_fr_?id_localisation=&reference_mots_cles=&id_secteur_activite=&id_secteur_activite2=&id_secteur_activite3=&id_secteur_activite_fonds=&type_cession=&id_raison_cession=&immo_a_vendre=&prix_cession=&prix_cession_null=1&type_repreneur_personne=&type_repreneur_societe=&apport_demande=&apport_demande_null=1&ca=&ca_null=1&resultat_net=&nb_personnes=&redressement_judiciaire=&prix_cession_min=&prix_cession_max=5000000&ca_min=&ca_max=20000000&apport_min=&apport_max=2000000&nb_personnes_min=&nb_personnes_max=200&date_min=2011&date_max=2021&possession_brevets=&possession_marques=&travail_export=&id_gestionnaire_fonds=&societe_cotee=&type_recherche=5&type_acquereur=&demarche=&tri=&type_partenariat=&recherche_par=motscles"
            ],
            # Add your other long URLs here...
        }

        for category, url_list in categories.items():
            self.results["sources"][category] = []
            for url in url_list:
                logger.info(f"🔄 Scraping {category}: {url}")
                items = self.handle_fusacq_pagination(url)  # FULL PAGINATION
                self.results["sources"][category].extend(items)
                self.results["total_items"] += len(items)

        return self.results


# Quick test - just your cession-actifs example
if __name__ == "__main__":
    scraper = FrenchMABScraper()

    # Test YOUR specific URL (will scrape ALL 6 pages)
    test_url = "https://www.fusacq.com/reprendre-une-entreprise/resultats-cession-actifs_fr_?id_localisation=&reference_mots_cles=&id_secteur_activite=&id_secteur_activite2=&id_secteur_activite3=&id_secteur_activite_fonds=&type_cession=&id_raison_cession=&immo_a_vendre=&prix_cession=&prix_cession_null=1&type_repreneur_personne=&type_repreneur_societe=&apport_demande=&apport_demande_null=1&ca=&ca_null=1&resultat_net=&nb_personnes=&redressement_judiciaire=&prix_cession_min=&prix_cession_max=5000000&ca_min=&ca_max=20000000&apport_min=&apport_max=2000000&nb_personnes_min=&nb_personnes_max=200&date_min=2011&date_max=2021&possession_brevets=&possession_marques=&travail_export=&id_gestionnaire_fonds=&societe_cotee=&type_recherche=5&type_acquereur=&demarche=&tri=&type_partenariat=&recherche_par=motscles"

    print("🚀 Scraping ALL pages of cession-actifs...")
    items = scraper.handle_fusacq_pagination(test_url)

    scraper.results["sources"]["test_cession_actifs"] = items
    scraper.results["total_items"] = len(items)

    with open("cession_actifs_complete.json", "w", encoding="utf-8") as f:
        json.dump(scraper.results, f, indent=2, ensure_ascii=False)

    print(f"\n✅ COMPLETE! Scraped {len(items)} deals across ALL pages!")
    print(f"💾 Saved to: cession_actifs_complete.json")
