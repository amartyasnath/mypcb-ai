# Public release status

This is one repository: `amartyasnath/mypcb-ai`. The latest application and setup
documentation are consolidated on `main`. Visibility remains private at the
owner's request. Local credentials, tools and generated output are not included.

## Repository settings

- Description and topics updated for the implemented electronics sourcing demo.
- Dependabot vulnerability alerts and automatic security-update PRs enabled.
- Website field intentionally empty until a permanent deployment exists.
- GitHub rejected secret scanning for the current private repository. After making
  it public, verify secret scanning and enable push protection under repository
  Settings > Advanced Security.
- Pinning to the personal profile requires a public repository. After changing
  visibility, use Customize pins on the profile and select `mypcb-ai`.

## Items requiring external access

- No browser was connected for a genuine application screenshot. Add a current
  desktop/mobile screenshot near the top of the README when one is available.
- Firebase cloud settings have not been verified. Confirm the deployed Firestore
  rules enforce per-user access and check the client key is restricted to the
  required Firebase APIs (not Gemini or unrelated paid APIs). Review authorized
  domains before enabling sign-in on a hosted domain.
- Permanent hosting is not configured. Do not use a temporary tunnel URL on a
  resume; it depends on the local computer staying awake and connected.

## Resume link

After making the repository public, use:

`https://github.com/amartyasnath/mypcb-ai`

Suggested label: **myPCB AI — Electronics Component Sourcing | GitHub**.

Visibility changes expose commit history as well as current files. A secret scan
is a useful check, not a guarantee that every kind of sensitive data is absent.

Gitleaks scanned all four existing commits before consolidation and flagged one
item: the Firebase client API key in `firebase-applet-config.json` from the initial
commit. No other supported secret patterns were reported. Firebase client keys
are public identifiers when restricted appropriately; their cloud restrictions
are still unverified. No history was rewritten and no cloud credentials were
rotated. The redacted scanner report stays local under ignored `.tools/`.
