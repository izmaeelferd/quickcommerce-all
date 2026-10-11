---
description: Install/check Docker, start the local demo of every app, and verify it works
---
Set up and start the local demo of this food delivery platform on this computer. Follow these steps in order and fix problems as you go. Explain each install step to the user before you run it.

1. **Detect the OS** (Windows / macOS / Linux) and the shell.
2. **Docker**
   - Check `docker --version` and `docker compose version`.
   - If Docker is missing, install it:
     - Windows: `winget install -e --id Docker.DockerDesktop`. If WSL2 is missing, run `wsl --install`; this may need a reboot, so tell the user.
     - macOS: `brew install --cask docker`.
     - Linux: the official convenience script `curl -fsSL https://get.docker.com | sh`, then add the user to the `docker` group.
   - Ask the user to start Docker Desktop if it isn't running. Wait until `docker info` succeeds, polling every few seconds for up to 3 minutes.
3. **Prebuilt web apps**: check that `demo/web/customer/index.html` exists. If it doesn't (for example, the user cloned from git instead of unzipping the all-in-one zip), check for Flutter and Node 18+ and run `scripts/build-web-demo.sh`. On Windows, run it with Git Bash or WSL, or run its steps directly in PowerShell.
4. **Ask once** whether the user wants to test from their phone on the same Wi-Fi.
   - If yes, use LAN mode: `scripts/demo.sh --lan`, or on Windows `powershell -ExecutionPolicy Bypass -File scripts\demo.ps1 -Lan`.
   - Otherwise, run it without the flag.
   - Optionally ask for their city so the sample restaurants appear nearby: set `DEMO_LAT` / `DEMO_LNG` in the environment before the first start.
5. **Start** with the matching script. If a port (8080, 5173, 5174) is busy, find which process holds it and tell the user.
6. **Verify** with HTTP requests:
   - `http://<host>:8080/api/health` returns 200
   - `http://<host>:8080/customer/`, `/partner/` and `/rider/` return 200
   - `http://<host>:5173` and `http://<host>:5174` return 200

   If something fails, check `docker compose -f docker-compose.demo.yml logs backend web --tail 80` and fix it.
7. **Windows LAN mode**: if the phone can't connect, offer to add a firewall rule for ports 8080, 5173 and 5174 on Private networks. This needs an admin PowerShell.
8. **Report** a table of the app links with their logins (from the script output), plus how to stop (`--stop`) and wipe (`--reset`). Point to `TESTING.md` section 2 for the full order walkthrough.
