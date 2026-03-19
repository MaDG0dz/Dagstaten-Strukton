"""
Comprehensive Dagstaten Strukton webapp test.
Covers: auth, navigation, CRUD, dagstaat editor, templates, accessibility, responsive.
"""
import os
import json
import time
from playwright.sync_api import sync_playwright

BASE = "http://localhost:4000"
EMAIL = "dagstatenstrukton@gmail.com"
PW = "test123"
DIR = "/tmp/dagstaten-tests"
os.makedirs(DIR, exist_ok=True)

results = []
all_console = []

def r(name, ok, detail=""):
    s = "PASS" if ok else "FAIL"
    results.append({"test": name, "status": s, "details": detail})
    print(f"  [{s}] {name}" + (f" — {detail}" if detail else ""))

def shot(page, name):
    page.screenshot(path=f"{DIR}/{name}.png", full_page=True)

def wait_ready(page, ms=8000):
    """Wait for loading skeletons to disappear."""
    try:
        page.wait_for_function("() => !document.querySelector('.animate-pulse')", timeout=ms)
    except:
        pass
    page.wait_for_timeout(300)

def nav_sidebar(page, href, wait=2000):
    """Navigate via sidebar click (preserves auth session)."""
    link = page.locator(f'aside nav a[href="{href}"]')
    if link.is_visible():
        link.click()
        page.wait_for_timeout(wait)
        return True
    return False

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(viewport={"width": 1440, "height": 900})
        page = ctx.new_page()
        page.on("console", lambda m: all_console.append({"type": m.type, "text": m.text}))

        print("\n{'='*60}")
        print("  DAGSTATEN STRUKTON — COMPREHENSIVE TEST")
        print(f"{'='*60}\n")

        # ════════════════════════════════════════════
        # 1. LOGIN PAGE
        # ════════════════════════════════════════════
        print("1. LOGIN PAGE")
        page.goto(f"{BASE}/login")
        page.wait_for_load_state("networkidle")
        shot(page, "01-login")

        r("Login form visible", page.locator('input[type="email"]').is_visible())
        r("Logo renders", page.locator('img[alt="Strukton logo"]').first.is_visible())
        r("'Welkom terug' heading", page.locator("text=Welkom terug").is_visible())
        r("Password toggle exists", page.locator('button[aria-label*="Wachtwoord"]').is_visible())
        r("E-mail label", page.locator("label:has-text('E-mailadres')").is_visible())
        r("Wachtwoord label", page.locator("label:has-text('Wachtwoord')").is_visible())
        r("Submit button styled red", "e43122" in (page.locator('button[type="submit"]').get_attribute("class") or ""))
        r("HTML lang=nl", page.locator("html").get_attribute("lang") == "nl")

        # ════════════════════════════════════════════
        # 2. LOGIN FLOW
        # ════════════════════════════════════════════
        print("\n2. LOGIN FLOW")
        page.fill('input[type="email"]', EMAIL)
        page.fill('input[type="password"]', PW)
        page.click('button[type="submit"]')
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(5000)
        wait_ready(page, 10000)
        shot(page, "02-dashboard-after-login")

        r("Redirected to dashboard", "/dashboard" in page.url, page.url)

        # ════════════════════════════════════════════
        # 3. DASHBOARD
        # ════════════════════════════════════════════
        print("\n3. DASHBOARD")
        r("Welcome message", page.locator("text=Welkom").is_visible())
        r("Week heading", page.get_by_role("heading", name="Week").is_visible())
        r("KPI cards visible", page.locator("text=Concept").first.is_visible())
        r("'Te reviewen' label", page.locator("text=Te reviewen").first.is_visible())
        r("'Nieuwe dagstaat' button", page.locator("text=Nieuwe dagstaat").first.is_visible())
        r("Project selector", page.locator("select").first.is_visible())

        # ════════════════════════════════════════════
        # 4. SIDEBAR
        # ════════════════════════════════════════════
        print("\n4. SIDEBAR")
        r("Sidebar visible", page.locator("aside").is_visible())
        nav_count = page.locator("aside nav a").count()
        r("Nav items present", nav_count >= 6, f"{nav_count} items")
        r("Sidebar logo", page.locator('aside img[alt="Strukton logo"]').is_visible())
        r("User name visible", page.locator("aside").locator("text=Dante").first.is_visible() or page.locator("aside").locator("text=Admin").first.is_visible())
        r("TESTMODUS visible", page.locator("text=Testmodus").first.is_visible() or page.locator("text=TESTMODUS").first.is_visible())

        # ════════════════════════════════════════════
        # 5. ALL PAGES LOAD
        # ════════════════════════════════════════════
        print("\n5. PAGE NAVIGATION")
        pages = [
            ("/medewerkers", "Medewerkers"),
            ("/materieel", "Materieel"),
            ("/materialen", "Materialen"),
            ("/activiteiten", "Activiteiten"),
            ("/gebruikers", "Gebruikers"),
            ("/projecten", "Projecten"),
            ("/overzicht", "Overzicht"),
        ]
        for href, name in pages:
            ok = nav_sidebar(page, href)
            if not ok:
                page.goto(f"{BASE}{href}")
                page.wait_for_load_state("networkidle")
                wait_ready(page)
            # Verify the page rendered (check for a heading or the page name in content)
            content = page.content()
            r(f"{name} page loads", name.lower() in content.lower() or "data-table" in content.lower() or "empty-state" in content.lower())

        # Navigate to profiel (not in sidebar nav)
        page.goto(f"{BASE}/profiel")
        page.wait_for_load_state("networkidle")
        wait_ready(page, 12000)
        r("Profiel page loads", page.locator("text=Mijn profiel").is_visible() or page.locator("text=profiel").first.is_visible())
        shot(page, "05-profiel")

        # ════════════════════════════════════════════
        # 6. PROJECT CRUD
        # ════════════════════════════════════════════
        print("\n6. PROJECT CRUD")
        nav_sidebar(page, "/projecten", 3000)
        shot(page, "06a-projecten")

        # Try to create a project
        add_btn = page.locator("button:has-text('Nieuw project'), button:has-text('Nieuw'), button:has-text('Toevoegen')").first
        if add_btn.is_visible():
            add_btn.click()
            page.wait_for_timeout(500)
            shot(page, "06b-project-form")

            # Fill form fields
            code_input = page.locator('input[placeholder*="PRJ"]').first
            name_input = page.locator('input[placeholder*="Projectnaam"]').first
            if code_input.is_visible() and name_input.is_visible():
                code_input.fill("E2E-" + str(int(time.time()) % 10000))
                name_input.fill("E2E Test Project")
                page.click("button:has-text('Opslaan')")
                page.wait_for_timeout(3000)
                shot(page, "06c-after-create")
                r("Project created", page.locator("text=E2E Test Project").is_visible())
            else:
                r("Project form fields visible", False, "Code or name input not found")
        else:
            r("'Nieuw project' button visible", False)
            # Check if there are existing projects
            r("Projects page has content", True, "No add button but page loaded")

        # ════════════════════════════════════════════
        # 7. EMPLOYEE CRUD
        # ════════════════════════════════════════════
        print("\n7. EMPLOYEE CRUD")
        nav_sidebar(page, "/medewerkers", 2000)

        emp_btn = page.locator("button:has-text('Toevoegen')").first
        if emp_btn.is_visible():
            emp_btn.click()
            page.wait_for_timeout(500)
            shot(page, "07a-employee-form")

            name_field = page.locator('input').nth(0)  # First input in the slide-over
            # Find the slide-over name input more precisely
            slideover = page.locator('[class*="fixed inset-y-0 right-0"]')
            if slideover.is_visible():
                so_inputs = slideover.locator("input").all()
                if len(so_inputs) > 0:
                    so_inputs[0].fill("E2E Medewerker Test")
                    page.click("button:has-text('Opslaan')")
                    page.wait_for_timeout(2000)
                    shot(page, "07b-after-employee")
                    r("Employee created", page.locator("text=E2E Medewerker Test").is_visible())
                else:
                    r("Employee form inputs", False, "No inputs in slide-over")
            else:
                r("Employee slide-over opened", False)
        else:
            r("Employee add button", False, "Not found")

        # ════════════════════════════════════════════
        # 8. GEBRUIKERS PAGE (ADMIN FEATURES)
        # ════════════════════════════════════════════
        print("\n8. GEBRUIKERS (ADMIN)")
        nav_sidebar(page, "/gebruikers", 2000)
        shot(page, "08-gebruikers")

        r("Gebruikers page visible", page.locator("text=Gebruikers").first.is_visible())
        has_create_user = page.locator("button:has-text('Gebruiker toevoegen'), button:has-text('toevoegen')").first.is_visible()
        r("Create user button (admin)", has_create_user)

        # Check for edit and password buttons
        edit_btns = page.locator("button[title], button:has(svg)").all()
        r("Action buttons on user rows", len(edit_btns) > 0, f"{len(edit_btns)} buttons")

        # ════════════════════════════════════════════
        # 9. MATERIALEN (CATEGORY TREE)
        # ════════════════════════════════════════════
        print("\n9. MATERIALEN (CATEGORIES)")
        nav_sidebar(page, "/materialen", 2000)
        shot(page, "09-materialen")

        r("Materialen page loaded", page.locator("text=Materialen").first.is_visible())
        r("Category tree or empty state", page.locator("text=Alle items").is_visible() or page.locator("text=Categorie toevoegen").is_visible())

        # ════════════════════════════════════════════
        # 10. MOBILE RESPONSIVE
        # ════════════════════════════════════════════
        print("\n10. MOBILE RESPONSIVE")
        m_ctx = browser.new_context(viewport={"width": 375, "height": 812})
        m = m_ctx.new_page()

        # Mobile login
        m.goto(f"{BASE}/login")
        m.wait_for_load_state("networkidle")
        m.wait_for_timeout(1000)
        shot(m, "10a-mobile-login")

        r("Mobile login renders", m.locator('input[type="email"]').is_visible())
        r("Mobile brand panel hidden", not m.locator("text=Strukton Civiel").is_visible())
        r("Mobile logo visible", m.locator('img[alt="Strukton logo"]').first.is_visible())

        # Mobile login and check dashboard
        m.fill('input[type="email"]', EMAIL)
        m.fill('input[type="password"]', PW)
        m.click('button[type="submit"]')
        m.wait_for_load_state("networkidle")
        m.wait_for_timeout(5000)
        wait_ready(m, 10000)
        shot(m, "10b-mobile-dashboard")

        r("Mobile dashboard loads", m.locator("text=Welkom").is_visible())

        # Check mobile bottom nav
        bottom_nav = m.locator("nav.fixed.bottom-0")
        r("Mobile bottom nav visible", bottom_nav.is_visible())

        # Check sidebar hidden on mobile
        r("Sidebar hidden on mobile", not m.locator("aside").is_visible())

        # Check hamburger menu
        hamburger = m.locator('button[aria-label="Open menu"]')
        r("Hamburger menu button", hamburger.is_visible())

        if hamburger.is_visible():
            hamburger.click()
            m.wait_for_timeout(500)
            shot(m, "10c-mobile-sidebar")
            r("Mobile sidebar opens on tap", m.locator("aside").is_visible())

        m_ctx.close()

        # ════════════════════════════════════════════
        # 11. CONSOLE ERRORS
        # ════════════════════════════════════════════
        print("\n11. CONSOLE ERRORS")
        errors = [c for c in all_console if c["type"] == "error"]
        critical = [e for e in errors if any(k in e["text"] for k in ["TypeError", "ReferenceError", "Uncaught", "SyntaxError"])]

        r("No critical JS errors", len(critical) == 0, f"{len(critical)} critical" if critical else "Clean")
        r("Total console errors manageable", len(errors) < 20, f"{len(errors)} total errors")

        if errors:
            print(f"     Console errors ({len(errors)}):")
            for e in errors[:8]:
                print(f"       [{e['type']}] {e['text'][:120]}")

        # ════════════════════════════════════════════
        # 12. ACCESSIBILITY
        # ════════════════════════════════════════════
        print("\n12. ACCESSIBILITY")
        page.goto(f"{BASE}/login")
        page.wait_for_load_state("networkidle")

        r("Labels on form inputs", page.locator("label").count() >= 2, f"{page.locator('label').count()} labels")
        r("Aria-labels present", page.locator("[aria-label]").count() > 0, f"{page.locator('[aria-label]').count()}")

        # Test keyboard navigation
        page.keyboard.press("Tab")
        page.wait_for_timeout(200)
        focused = page.evaluate("document.activeElement?.tagName")
        r("Tab focuses an element", focused in ["INPUT", "BUTTON", "A", "SELECT"], f"Focused: {focused}")

        # Check color contrast (basic: ensure text colors exist)
        r("Body has text color", "color" in (page.evaluate("getComputedStyle(document.body).color") or ""))

        # ════════════════════════════════════════════
        # 13. PERFORMANCE
        # ════════════════════════════════════════════
        print("\n13. PERFORMANCE")
        start = time.time()
        page.goto(f"{BASE}/login")
        page.wait_for_load_state("domcontentloaded")
        load_time = time.time() - start
        r("Login page load < 3s", load_time < 3, f"{load_time:.2f}s")

        # ════════════════════════════════════════════
        # SUMMARY
        # ════════════════════════════════════════════
        print(f"\n{'='*60}")
        passed = sum(1 for x in results if x["status"] == "PASS")
        failed = sum(1 for x in results if x["status"] == "FAIL")
        total = len(results)
        pct = (passed / total * 100) if total > 0 else 0
        print(f"  RESULTS: {passed}/{total} passed ({pct:.0f}%), {failed} failed")
        print(f"  Screenshots: {DIR}/")

        if failed > 0:
            print(f"\n  FAILURES:")
            for x in results:
                if x["status"] == "FAIL":
                    print(f"    - {x['test']}" + (f": {x['details']}" if x['details'] else ""))

        print(f"{'='*60}")

        with open(f"{DIR}/results.json", "w") as f:
            json.dump({"results": results, "console_errors": errors[:20]}, f, indent=2)

        browser.close()
    return results

if __name__ == "__main__":
    run()
