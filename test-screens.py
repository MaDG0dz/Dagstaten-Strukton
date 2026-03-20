"""Quick screen check — login, navigate every page via sidebar, screenshot each."""
import os, time
from playwright.sync_api import sync_playwright

BASE = "http://localhost:4000"
DIR = "/tmp/dagstaten-screens"
os.makedirs(DIR, exist_ok=True)

errors_found = []

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(viewport={"width": 1440, "height": 900})
        page = ctx.new_page()

        js_errors = []
        page.on("console", lambda m: js_errors.append(m.text) if m.type == "error" else None)

        # Login
        print("Logging in...")
        page.goto(f"{BASE}/login")
        page.wait_for_load_state("networkidle")
        page.fill('input[type="email"]', "dagstatenstrukton@gmail.com")
        page.fill('input[type="password"]', "test123")
        page.click('button[type="submit"]')
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(5000)

        # Wait for skeleton to clear
        try:
            page.wait_for_function("() => !document.querySelector('.animate-pulse')", timeout=10000)
        except:
            pass

        page.screenshot(path=f"{DIR}/01-dashboard.png", full_page=True)
        print(f"  Dashboard: {page.url}")

        # Check each page via sidebar
        pages = [
            ("/dashboard", "Dashboard"),
            ("/projecten", "Projecten"),
            ("/overzicht", "Overzicht"),
            ("/medewerkers", "Medewerkers"),
            ("/materieel", "Materieel"),
            ("/materialen", "Materialen"),
            ("/activiteiten", "Activiteiten"),
            ("/gebruikers", "Gebruikers"),
        ]

        for i, (href, name) in enumerate(pages):
            link = page.locator(f'aside nav a[href="{href}"]')
            if link.is_visible():
                link.click()
                page.wait_for_timeout(2000)
            else:
                page.goto(f"{BASE}{href}")
                page.wait_for_load_state("networkidle")
                page.wait_for_timeout(3000)

            page.screenshot(path=f"{DIR}/{i+2:02d}-{name.lower()}.png", full_page=True)

            # Check for issues
            content = page.content()
            has_skeleton = '.animate-pulse' in content and page.locator('.animate-pulse').first.is_visible()
            has_error = 'Error' in page.title() or page.locator("text=Error").count() > 0
            is_blank = len(content) < 500

            status = "OK"
            if has_skeleton:
                status = "SKELETON (still loading)"
                errors_found.append(f"{name}: showing skeleton")
            if has_error:
                status = "ERROR"
                errors_found.append(f"{name}: error on page")
            if is_blank:
                status = "BLANK"
                errors_found.append(f"{name}: blank page")

            print(f"  {name}: {status}")

        # Check profiel (not in sidebar)
        page.goto(f"{BASE}/profiel")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(5000)
        try:
            page.wait_for_function("() => !document.querySelector('.animate-pulse')", timeout=8000)
        except:
            pass
        page.screenshot(path=f"{DIR}/11-profiel.png", full_page=True)
        has_content = page.locator("text=profiel").first.is_visible() or page.locator("text=Profiel").first.is_visible()
        print(f"  Profiel: {'OK' if has_content else 'ISSUE'}")
        if not has_content:
            errors_found.append("Profiel: not loading")

        # Check project detail (if any project exists)
        page.locator('aside nav a[href="/projecten"]').click()
        page.wait_for_timeout(2000)
        project_link = page.locator('a[href*="/projecten/"]').first
        if project_link.is_visible():
            project_link.click()
            page.wait_for_timeout(3000)
            page.screenshot(path=f"{DIR}/12-project-detail.png", full_page=True)
            print(f"  Project detail: {page.url}")
        else:
            print("  Project detail: No projects to test")

        # JS errors
        print(f"\nJS errors: {len(js_errors)}")
        for e in js_errors[:10]:
            print(f"  - {e[:150]}")

        if errors_found:
            print(f"\n⚠ ISSUES FOUND ({len(errors_found)}):")
            for e in errors_found:
                print(f"  - {e}")
        else:
            print("\n✓ All screens loaded successfully")

        print(f"\nScreenshots saved to {DIR}/")
        browser.close()

if __name__ == "__main__":
    run()
