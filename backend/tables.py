"""
Construit un RecommendationTable pertinent pour une question donnée, en
réutilisant l'extraction d'entités déjà écrite pour l'agent (Phase 9) —
aucune nouvelle logique de matching, juste un branchement supplémentaire.

Ajout pur : n'importe quel comportement existant de CadenceAgent.answer()
n'est pas modifié. Ce module est appelé EN PLUS, dans le handler /api/chat.
"""

from __future__ import annotations

from schemas import RecommendationRow, RecommendationTable

from src.agent.entities import match_machine, match_produit


def build_recommendation_table(agent, message: str) -> RecommendationTable | None:
    produit = match_produit(message, agent.produits, agent.code_index)
    machine = match_machine(message, agent.machines)

    if not produit and not machine:
        return None

    if produit and machine:
        matches = [r for r in agent.recommendations if r.produit == produit and r.machine == machine]
    elif produit:
        matches = [r for r in agent.recommendations if r.produit == produit]
    else:
        matches = [r for r in agent.recommendations if r.machine == machine]

    if not matches:
        return None

    rows = [
        RecommendationRow(
            produit=r.produit,
            machine=r.machine,
            fiable=r.fiable,
            cadence_theorique_actuelle=r.cadence_theorique_actuelle,
            cadence_recommandee=r.cadence_recommandee,
            ecart_vs_theorique_pct=r.ecart_vs_theorique_pct,
            trs_moyen_reference=r.trs_moyen_reference,
            n_of_utilises=r.n_of_utilises,
            n_of_disponibles=r.n_of_disponibles,
            justification=" ".join(r.justification),
        )
        for r in matches
    ]
    return RecommendationTable(rows=rows)