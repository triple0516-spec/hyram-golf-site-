/* Fill API hostname only after verified production deployment. No secrets in this file. */
window.HYRAM_API_BASE = "";
window.HYRAM_AI_ENDPOINT = window.HYRAM_API_BASE ? new URL("/api/chat",window.HYRAM_API_BASE).href : null;
