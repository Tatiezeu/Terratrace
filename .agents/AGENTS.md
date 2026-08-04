# TerraTrace Coding Assistant Rules

- **Precise and Concise**: Keep responses brief, direct, and focused. Avoid lengthy, unnecessary explanations.
- **No Hallucinations / Fake Data**: Never invent statistics, plot counts, prices, or user data.
- **Backend Data Verification**: When asked about database or backend statistics (e.g., number of land plots), run a database query script to retrieve the real, live figures from the database instead of guessing.
- **Location Structure**: Locations in Cameroon do not have quarters, neighborhoods, or sub-districts. Use only city and region names.
