export default ({ config }) => {
  // Vercel automatically sets the VERCEL environment variable to '1' during build.
  // If we are on Vercel, we must remove the baseUrl because Vercel hosts at the root domain.
  // Otherwise, we keep the baseUrl for GitHub Pages (/PersonalBudgetApp).
  const isVercel = process.env.VERCEL === '1';
  
  if (isVercel) {
    if (config.experiments) {
      config.experiments.baseUrl = "";
    } else {
      config.experiments = { baseUrl: "" };
    }
  }

  return config;
};
