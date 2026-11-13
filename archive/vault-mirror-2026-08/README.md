# Vault mirror, August 2026

These files existed only in the MASTER-BRAIN copy of the project
(`03-Projects/motopass`) and not in this repository. They are kept here so that
nothing unique is lost when that copy is archived.

They are **not** wired into the build. `savingsGraphExport.ts` imports
`SavingsRow` from `src/lib/pitchStats`, which no longer exports it, so the code
does not compile against the current pipeline. Restoring any of it means
re-deriving that type, not copying the file back.

Not copied here, because they are binary and large: the two explainer videos
(`public/video/motopass-explainer.mp4`, `motopass-ots-walkthrough.mp4`, 11 MB
each) and three screenshot artifacts. They remain in the vault copy until it is
archived.
