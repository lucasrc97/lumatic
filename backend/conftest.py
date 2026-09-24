import os

# Keep the app's background trash purge from touching a real database during tests.
# Must run before `core.config.settings` is created, i.e. before any app import.
os.environ["TRASH_AUTO_PURGE"] = "false"
