# GitHub profile cards on Vercel

This project serves two SVGs for `MrEshrati`. GitHub Stats shows the past 12 months of activity. The ring shows a custom activity grade based on the share of calendar days with a contribution. The total includes anonymous private activity when enabled. GitHub's commit, pull request, and issue breakdowns reflect the activity available to the token. Most Used Languages ranks languages by code size in the account's public and private non-fork repositories. The repository list is fetched anew when the card refreshes, so new repositories are included automatically once GitHub detects their languages.

| Grade | Share of active days |
| --- | --- |
| A+ | At least 70% |
| A | At least 60% |
| A− | At least 50% |
| B+ | At least 40% |
| B | At least 30% |
| B− | At least 20% |
| C | At least 10% |
| D | Below 10% |

1. In [GitHub's fine-grained token settings](https://github.com/settings/personal-access-tokens/new), create a token with **Resource owner → MrEshrati**, **Repository access → All repositories**, and **Metadata → Read-only**. This gives the language card access to metadata from current and future personal repositories.
2. In [GitHub's classic token settings](https://github.com/settings/tokens/new), create a second token with just **`read:user`** for the contribution calendar. On your profile, enable **Contribution settings → Private contributions** if needed. GitHub then includes anonymous private activity counts. [GitHub's contribution settings](https://docs.github.com/en/account-and-profile/concepts/contributions-on-your-profile#public-and-private-repository-activity)
3. [Create a Vercel project](https://vercel.com/new) from `MrEshrati/MrEshrati`, choose **Other** as the framework preset, and select `vercel-stats` as the root directory. Leave custom build and install commands unset.
4. Add the two tokens as **Production** secrets in that project. Use `GITHUB_LANGUAGES_TOKEN` for the fine-grained token and `GITHUB_ACTIVITY_TOKEN` for the classic token. Deploy after adding the secrets. [Vercel environment variable settings](https://vercel.com/docs/environment-variables/managing-environment-variables)
5. Open `/api/stats` and `/api/languages` on the production domain in a signed-out browser to confirm both SVG cards load. Use the production domain in the profile README so GitHub can fetch them.

```html
## GitHub activity

<p align="center">
  <img src="https://YOUR-PRODUCTION-DOMAIN/api/stats" alt="GitHub Stats for the last 12 months" width="330" />
  <img src="https://YOUR-PRODUCTION-DOMAIN/api/languages" alt="Most Used Languages by code size" width="330" />
</p>
```

Both URLs are public and serve aggregate results. They omit repository names, source code, and credentials. The service refreshes cached data approximately hourly during normal operation. GitHub's image cache and language detection can add a delay. Renew expired tokens in Vercel and redeploy.
