# InsectAI

**Using image-based AI for insect monitoring and conservation**

InsectAI is a European community connecting researchers, ecologists, technologists, and other stakeholders. Together, we advance image-based AI approaches for monitoring insects and supporting conservation.

Our work spans societal needs, image collection, image processing, and the analysis and integration of monitoring data. We share open tools, datasets, models, and learning resources to support this work.

## Explore InsectAI

- [Visit the InsectAI website](https://insectai.eu/)
- [See our landing page for various resources](https://insectai-cost-action.github.io/)
- [Browse our GitHub repositories](https://github.com/orgs/InsectAI-COST-Action/repositories)
- [About our COST Action CA22129](https://www.cost.eu/actions/CA22129/)

<details>
<summary>Technical notes for maintainers</summary>

### Show this on the organization profile

GitHub displays an organization profile README in the Overview tab when its content is committed to `profile/README.md` in the organization's public `.github` repository. The root README in the landing-page repository does not appear on the organization profile automatically.

### Maintain, preview, and publish the website

The site is built with Hugo Extended 0.167.0. Update repository cards in `data/resources.yaml` and event cards in `data/events.yaml`; the page layout, stylesheet, and cursor effect live in `layouts/` and `assets/`. Each repository entry accepts an `image` URL or site path and an `imageAlt` description. New entries use the shared placeholder at `static/images/repo-placeholder.svg` unless another image is specified.

Install Hugo Extended, then run `hugo server` from the repository root to preview changes at `http://localhost:1313/`. Run `hugo --minify` to build the site into `public/`.

The GitHub Actions workflow in `.github/workflows/deploy.yml` builds and deploys the site on pushes to `main`. In the repository, open **Settings → Pages** and set the build and deployment source to **GitHub Actions**. The organization-root site is available at `https://insectai-cost-action.github.io/` after deployment.

### Access control

GitHub Pages is public by default. A private Pages site requires GitHub Enterprise Cloud and must be a project site published from a private or internal repository owned by the organization. The site is available to people with read access to that repository. The organization-root repository `InsectAI-COST-Action.github.io` cannot use Pages access control.

</details>