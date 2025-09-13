# This pragma enables Docker BuildKit features
# syntax=docker/dockerfile:1.4

# ---- Base Image ----
FROM python:3.11-slim

# ---- Install uv ----
# SIMPLIFIED: We use pip to install uv. This is a more direct and reliable
# method inside Docker as it places the 'uv' executable in a standard
# location that is already in the system's PATH.
RUN pip install uv

WORKDIR /app

# ---- Create a virtual environment ----
# Now we can just call 'uv' directly.
RUN uv venv

# ---- Install Dependencies ----
# Copy the project definition and the lockfile.
COPY pyproject.toml uv.lock* ./

# Use 'uv sync' to install dependencies into the virtual environment.
RUN uv sync --frozen

# ---- Copy Application Code ----
COPY ./app ./app

# ---- Final Command ----
# Use 'uv run' to execute the server within the project's virtual environment.
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

