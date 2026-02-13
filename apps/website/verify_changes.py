from playwright.sync_api import sync_playwright

def verify_changes():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Use a large viewport to see the desktop layout
        context = browser.new_context(viewport={"width": 1920, "height": 1080})
        page = context.new_page()

        try:
            # Navigate to the home page
            print("Navigating to home page...")
            page.goto("http://localhost:3000")
            page.wait_for_load_state("networkidle")

            # Screenshot of Hero Section (Gradient, CTAs, Text move)
            print("Taking screenshot of Hero Section...")
            page.screenshot(path="/home/jules/verification/home_hero.png", clip={"x": 0, "y": 0, "width": 1920, "height": 800})

            # Use specific selectors for sections, avoiding text based locators that might change
            # KPI Band
            print("Taking screenshot of KPI Band...")
            # We look for the section following the hero. The hero is the first section.
            # Or better, we look for the section containing the counters.
            # Since we updated KPIBand to use Counter component, we can look for "counter-container" class?
            # Or just scroll down bit by bit.

            # Just take a full page screenshot to see everything
            page.screenshot(path="/home/jules/verification/full_page.png", full_page=True)
            print("Full page screenshot taken.")


            # Navigate to Operations Page
            print("Navigating to Operations page...")
            page.goto("http://localhost:3000/operations")
            page.wait_for_load_state("networkidle")

            # Screenshot of Operations Page (Header, Filter, Grid)
            print("Taking screenshot of Operations Page...")
            page.screenshot(path="/home/jules/verification/operations_page.png", full_page=True)

        except Exception as e:
            print(f"Error during verification: {e}")
            page.screenshot(path="/home/jules/verification/error.png")
            raise e
        finally:
            browser.close()

if __name__ == "__main__":
    verify_changes()
