"""
Full webapp test for Dagstaten Strukton.
Tests: login, dashboard, CRUD pages, dagstaat editor, navigation, responsive.
"""
import os
import json
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:4000"
EMAIL = "dagstatenstrukton@gmail.com"
PASSWORD = "test123"
SCREENSHOTS_DIR = "/tmp/dagstaten-tests"

os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

results = []

def log_result(test_name, passed, details=""):
    status = "PASS" if passed else "FAIL"
    results.append({"test": test_name, "status": status, "details": details})
    print(f"  [{status}] {test_name}" + (f" — {details}" if details else ""))


def wait_for_app(page, timeout=10000):
    """Wait until the loading skeleton disappears and actual content renders."""
    try:
        page.wait_for_function(
            "() => !document.querySelector('.animate-pulse')",
            timeout=timeout
        )
    except:
        pass
    page.wait_for_timeout(500)


def run_tests():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        console_errors = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)

        print("\n=== DAGSTATEN STRUKTON — FULL WEBAPP TEST ===\n")

        # ─── TEST 1: Login page loads ───
        print("1. Login Page")
        page.goto(f"{BASE_URL}/login")
        page.wait_for_load_state("networkidle")
        page.screenshot(path=f"{SCREENSHOTS_DIR}/01-login.png", full_page=True)

        has_login_form = page.locator('input[type="email"]').is_visible()
        log_result("Login page renders", has_login_form)

        has_logo = page.locator('img[alt="Strukton logo"]').first.is_visible()
        log_result("Logo loads on login page", has_logo)

        has_heading = page.locator("text=Welkom terug").is_visible()
        log_result("'Welkom terug' heading visible", has_heading)

        has_password_toggle = page.locator('button[aria-label*="Wachtwoord"]').is_visible()
        log_result("Password toggle button present", has_password_toggle)

        # Check label elements
        labels = page.locator("label").all()
        log_result("Form labels present on login", len(labels) >= 2, f"{len(labels)} labels")

        # ─── TEST 2: Login flow ───
        print("\n2. Login Flow")
        page.fill('input[type="email"]', EMAIL)
        page.fill('input[type="password"]', PASSWORD)
        page.click('button[type="submit"]')
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(5000)  # Give auth time
        page.screenshot(path=f"{SCREENSHOTS_DIR}/02-after-login.png", full_page=True)

        current_url = page.url
        logged_in = "/dashboard" in current_url
        log_result("Login redirects to dashboard", logged_in, current_url)

        # ─── TEST 3: Dashboard (use same session from login) ───
        print("\n3. Dashboard")
        # Don't navigate away — we're already on dashboard after login
        wait_for_app(page, 15000)
        page.screenshot(path=f"{SCREENSHOTS_DIR}/03-dashboard.png", full_page=True)

        has_welcome = page.locator("text=Welkom").is_visible()
        log_result("Dashboard welcome message visible", has_welcome)

        has_week = page.get_by_role("heading", name="Week").is_visible()
        log_result("Week indicator visible", has_week)

        # ─── TEST 4: Sidebar navigation ───
        print("\n4. Sidebar Navigation")
        sidebar = page.locator("aside")
        sidebar_visible = sidebar.is_visible()
        log_result("Sidebar is visible on desktop", sidebar_visible)

        nav_items = page.locator("aside nav a").all()
        log_result("Navigation items present", len(nav_items) > 0, f"{len(nav_items)} items")

        has_sidebar_logo = page.locator('aside img[alt="Strukton logo"]').is_visible()
        log_result("Sidebar logo visible", has_sidebar_logo)

        # ─── TEST 5: CRUD Pages load ───
        print("\n5. CRUD Pages")
        crud_pages = [
            ("/medewerkers", "Medewerkers"),
            ("/materieel", "Materieel"),
            ("/materialen", "Materialen"),
            ("/activiteiten", "Activiteiten"),
            ("/gebruikers", "Gebruikers"),
            ("/projecten", "Projecten"),
            ("/overzicht", "Overzicht"),
            ("/profiel", "Profiel"),
        ]

        for path, name in crud_pages:
            # Use sidebar clicks for client-side navigation (no full reload)
            sidebar_link = page.locator(f'aside nav a[href="{path}"]')
            if sidebar_link.is_visible():
                sidebar_link.click()
                page.wait_for_timeout(1500)
            else:
                page.goto(f"{BASE_URL}{path}")
                page.wait_for_load_state("networkidle")
                wait_for_app(page)
            has_error = page.locator("text=Error").first.is_visible() if page.locator("text=Error").count() > 0 else False
            page_loaded = not has_error
            log_result(f"{name} page loads", page_loaded)

        page.screenshot(path=f"{SCREENSHOTS_DIR}/05-projecten.png", full_page=True)

        # ─── TEST 6: Create a project ───
        print("\n6. Project Creation")
        sidebar_proj = page.locator('aside nav a[href="/projecten"]')
        if sidebar_proj.is_visible():
            sidebar_proj.click()
            page.wait_for_timeout(3000)
        else:
            page.goto(f"{BASE_URL}/projecten")
            page.wait_for_load_state("networkidle")
            wait_for_app(page)

        page.screenshot(path=f"{SCREENSHOTS_DIR}/06-projecten-page.png", full_page=True)
        add_btn = page.locator("button:has-text('Nieuw project')")
        if add_btn.is_visible():
            add_btn.click()
            page.wait_for_timeout(500)
            page.screenshot(path=f"{SCREENSHOTS_DIR}/06-project-form.png", full_page=True)

            page.fill('input[placeholder="PRJ-2026-001"]', "TEST-E2E-002")
            page.fill('input[placeholder="Projectnaam"]', "E2E Test Project")
            page.click("text=Opslaan")
            page.wait_for_timeout(3000)
            page.screenshot(path=f"{SCREENSHOTS_DIR}/06b-after-create.png", full_page=True)

            has_project = page.locator("text=E2E Test Project").is_visible()
            log_result("Project created successfully", has_project)
        else:
            log_result("Project creation - Add button visible", False, "Button not found")
            page.screenshot(path=f"{SCREENSHOTS_DIR}/06-no-button.png", full_page=True)

        # ─── TEST 7: Create employee ───
        print("\n7. Employee Creation")
        sidebar_emp = page.locator('aside nav a[href="/medewerkers"]')
        if sidebar_emp.is_visible():
            sidebar_emp.click()
            page.wait_for_timeout(2000)
        else:
            page.goto(f"{BASE_URL}/medewerkers")
            page.wait_for_load_state("networkidle")
            wait_for_app(page)

        add_emp = page.locator("button:has-text('Toevoegen')").first
        if add_emp.is_visible():
            add_emp.click()
            page.wait_for_timeout(500)

            name_input = page.locator('input[placeholder*="naam" i], input[placeholder*="Naam"]').first
            if name_input.is_visible():
                name_input.fill("Test Medewerker E2E")
                page.click("text=Opslaan")
                page.wait_for_timeout(2000)
                has_emp = page.locator("text=Test Medewerker E2E").is_visible()
                log_result("Employee created successfully", has_emp)
            else:
                log_result("Employee form rendered", False, "Name input not found")
        else:
            log_result("Employee creation - Add button visible", False, "Button not found")

        page.screenshot(path=f"{SCREENSHOTS_DIR}/07-medewerkers.png", full_page=True)

        # ─── TEST 8: Mobile responsiveness ───
        print("\n8. Mobile Responsiveness")
        mobile_context = browser.new_context(viewport={"width": 375, "height": 812})
        mobile_page = mobile_context.new_page()
        mobile_page.goto(f"{BASE_URL}/login")
        mobile_page.wait_for_load_state("networkidle")
        mobile_page.wait_for_timeout(1000)
        mobile_page.screenshot(path=f"{SCREENSHOTS_DIR}/08-mobile-login.png", full_page=True)

        mobile_form = mobile_page.locator('input[type="email"]').is_visible()
        log_result("Mobile login page renders", mobile_form)

        mobile_logo = mobile_page.locator('img[alt="Strukton logo"]').first.is_visible()
        log_result("Mobile logo visible", mobile_logo)

        # Check left panel is hidden
        left_panel_hidden = not mobile_page.locator("text=Strukton Civiel").is_visible()
        log_result("Desktop brand panel hidden on mobile", left_panel_hidden)

        mobile_context.close()

        # ─── TEST 9: Console errors ───
        print("\n9. Console Errors")
        critical_errors = [e for e in console_errors if "TypeError" in e or "ReferenceError" in e or "Uncaught" in e]
        log_result("No critical JS console errors", len(critical_errors) == 0,
                   f"{len(critical_errors)} critical errors" if critical_errors else "Clean")
        if console_errors:
            print(f"     Total console errors: {len(console_errors)}")
            for e in console_errors[:5]:
                print(f"       - {e[:150]}")

        # ─── TEST 10: Accessibility ───
        print("\n10. Accessibility Checks")
        page.goto(f"{BASE_URL}/login")
        page.wait_for_load_state("networkidle")

        # Check focus rings work
        page.keyboard.press("Tab")
        page.wait_for_timeout(200)
        page.screenshot(path=f"{SCREENSHOTS_DIR}/10-focus.png", full_page=True)

        aria_labels = page.locator("[aria-label]").all()
        log_result("Aria labels on interactive elements", len(aria_labels) > 0, f"{len(aria_labels)}")

        # Check HTML lang attribute
        lang = page.locator("html").get_attribute("lang")
        log_result("HTML lang attribute set to 'nl'", lang == "nl", f"lang={lang}")

        # ─── Summary ───
        print("\n" + "=" * 55)
        passed = sum(1 for r in results if r["status"] == "PASS")
        failed = sum(1 for r in results if r["status"] == "FAIL")
        total = len(results)
        print(f"  RESULTS: {passed}/{total} passed, {failed} failed")
        print(f"  Screenshots: {SCREENSHOTS_DIR}/")
        print("=" * 55)

        with open(f"{SCREENSHOTS_DIR}/results.json", "w") as f:
            json.dump(results, f, indent=2)

        browser.close()

    return results


if __name__ == "__main__":
    run_tests()
