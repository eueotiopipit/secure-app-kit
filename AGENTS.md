<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep authenticated financial features as separate routes under the managed `_authenticated` gate, sharing one AppShell; this preserves route-level code splitting and one security boundary.
- Store money as integer cents in the database and derive balances from child movements; this prevents floating-point drift and conflicting totals.
