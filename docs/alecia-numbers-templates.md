# Alecia Numbers - M&A Templates Documentation

> Documentation complete des 10 templates Excel pour l'implementation dans Alecia Numbers

## Vue d'ensemble

Alecia Numbers integre 10 templates M&A professionnels, chacun concu pour une etape specifique du processus de transaction. Cette documentation detaille la structure, les formules et la logique metier de chaque template.

---

## 1. Due Diligence Checklist

**Fichier source:** `01_Due_Diligence_Checklist.xlsx`

### Description
Checklist complete pour le suivi des travaux de due diligence avec 49 points de controle repartis en categories.

### Structure
| Feuille | Dimensions | Formules |
|---------|------------|----------|
| Due Diligence | B2:L57 | 5 |

### Categories de DD
- Juridique & Corporate
- Financier & Comptable
- Fiscal
- Social & RH
- Commercial & Marche
- Operationnel & IT
- Environnemental

### Formules cles
```
L6  = COUNTA(C9:C57)                    // Total des items
L7  = COUNTIF(E9:E57,"Termine")         // Items termines
L8  = COUNTIF(E9:E57,"En cours")        // Items en cours
L9  = COUNTIF(E9:E57,"Bloque")          // Items bloques
L10 = ROUND(L7/L6*100,1)&"%"            // Pourcentage completion
```

### Colonnes de donnees
- **B**: Numero
- **C**: Item de DD
- **D**: Responsable
- **E**: Statut (Termine/En cours/Bloque/A faire)
- **F**: Priorite (Haute/Moyenne/Basse)
- **G**: Date limite
- **H**: Date completion
- **I**: Documents requis
- **J**: Commentaires
- **K**: Red flags

### Implementation Alecia Numbers
- **Type**: Checklist interactive avec progression
- **Features**: Filtres par categorie/statut, assignation, notifications

---

## 2. Valuation Multiples

**Fichier source:** `02_Valuation_Multiples.xlsx`

### Description
Outil de valorisation par multiples comparables avec calcul automatique des fourchettes de valeur.

### Structure
| Feuille | Dimensions | Formules |
|---------|------------|----------|
| Multiples | B2:K36 | 41 |

### Sections
1. **Metriques financieres de la cible** (lignes 7-14)
2. **Metriques calculees** (EV, marges)
3. **Analyse des multiples comparables** (lignes 17-22)
4. **Statistiques des multiples** (lignes 24-26)
5. **Application a la cible** (lignes 29-31)
6. **Valorisation finale** (lignes 33-36)

### Formules cles
```
// Calcul Enterprise Value
H8 = C12+C14-C15                        // EV = EBITDA + Dette - Cash

// Marges
H9 = IF(C8=0,0,C9/C8)                   // Marge EBITDA
H10 = IF(C8=0,0,C10/C8)                 // Marge EBIT

// Statistiques comparables
C25 = MEDIAN(G18:G22)                   // Mediane EV/Sales
D25 = AVERAGE(G18:G22)                  // Moyenne EV/Sales
E25 = MIN(G18:G22)                      // Min
F25 = MAX(G18:G22)                      // Max

// Valorisation
E30 = C32*D32                           // Valeur centrale
F30 = C32*0.9*D32                       // Fourchette basse (-10%)
G30 = C32*1.1*D32                       // Fourchette haute (+10%)

// Synthese
C34 = IFERROR(AVERAGE(E32:E33),0)       // Valorisation moyenne
C35 = MIN(F32:F33)                      // Min fourchette
C36 = MAX(G32:G33)                      // Max fourchette
```

### Implementation Alecia Numbers
- **Type**: Formulaire + visualisation graphique
- **Features**: Graphique de valorisation, export rapport, historique

---

## 3. Financial Model 3-Statement

**Fichier source:** `03_Financial_Model_3Statement.xlsx`

### Description
Modele financier complet a 3 etats sur 8 ans (N-2 a N+5) pour projections et valorisation DCF.

### Structure
| Feuille | Dimensions | Formules |
|---------|------------|----------|
| Compte de Resultat | B2:M40 | 72 |
| Bilan | B2:M40 | 48 |
| Flux de Tresorerie | B2:M30 | 40 |

### Compte de Resultat (P&L)
```
// Chiffre d'affaires total
C10 = SUM(C8:C9)                        // Produits + Services

// Charges d'exploitation
C15 = SUM(C13:C14)                      // Achats + Sous-traitance

// Charges de personnel
C20 = SUM(C18:C19)                      // Salaires + Charges sociales

// Autres charges
C27 = SUM(C23:C26)                      // Loyers + Services + Autres

// EBITDA
C31 = C10-C15-C20-C27-C29               // CA - Charges

// Resultat d'exploitation
C35 = C31-C32                           // EBITDA - D&A

// EBITDA (autre calcul)
C37 = C28+C33                           // Verification

// Impot sur les societes
C38 = IF(C34>0,C34*0.25,0)              // 25% si benefice

// Resultat net
C40 = C34-C35                           // RAI - Impot
```

### Bilan
```
// Actif immobilise net
C13 = SUM(C9:C11)                       // Immo brutes - Amortissements

// Actif circulant
C20 = SUM(C14:C17)                      // Stocks + Creances + Autres

// Total actif
C22 = C12+C18                           // Immo + Circulant

// Capitaux propres
C30 = SUM(C22:C24)                      // Capital + Reserves + Resultat

// Dettes
C38 = SUM(C28:C32)                      // LT + CT + Fournisseurs

// Total passif
C40 = C25+C33                           // CP + Dettes
```

### Flux de Tresorerie (Cash Flow)
```
// Flux d'exploitation
C13 = SUM(C8:C12)                       // RN + D&A + Variation BFR

// Flux d'investissement
C18 = SUM(C15:C16)                      // CAPEX + Cessions

// Flux de financement
C25 = SUM(C19:C22)                      // Emprunts + Remboursements + Dividendes

// Variation nette tresorerie
C27 = C13+C17+C23                       // Somme des flux

// Tresorerie finale
C30 = C25+C26                           // Debut + Variation
```

### Implementation Alecia Numbers
- **Type**: Spreadsheet complet (Luckysheet)
- **Features**: Liens entre feuilles, graphiques automatiques, scenarios

---

## 4. Comparable Companies

**Fichier source:** `04_Comparable_Companies.xlsx`

### Description
Analyse de societes comparables pour benchmarking et valorisation par multiples de marche.

### Structure
| Feuille | Dimensions | Formules |
|---------|------------|----------|
| Comparables | B2:P35 | 35 |

### Sections
1. **Donnees de la cible** (lignes 7-14)
2. **Panel de comparables** (lignes 17-22) - 8 societes
3. **Statistiques** (lignes 24-27)
4. **Application valorisation** (lignes 29-35)

### Formules cles
```
// Statistiques des multiples
C20 = MEDIAN(K8:K15)                    // Mediane marge EBITDA
D20 = AVERAGE(K8:K15)                   // Moyenne
E20 = MIN(K8:K15)                       // Min
F20 = MAX(K8:K15)                       // Max
G20 = STDEV(K8:K15)                     // Ecart-type

// Application valorisation
C27 = D21                               // Multiple EV/EBITDA median
D27 = C10                               // EBITDA cible
E27 = C28*D28                           // Valorisation implicite

// Synthese
C33 = AVERAGE(E28:E31)                  // Moyenne des methodes
C34 = MIN(E28:E31)                      // Plancher
C35 = MAX(E28:E31)                      // Plafond
```

### Implementation Alecia Numbers
- **Type**: Tableau interactif + graphiques
- **Features**: Import donnees de marche, visualisation radar, export

---

## 5. Deal Pipeline

**Fichier source:** `05_Deal_Pipeline.xlsx`

### Description
Suivi du pipeline de transactions avec metriques de performance et probabilite ponderee.

### Structure
| Feuille | Dimensions | Formules |
|---------|------------|----------|
| Pipeline | B2:O21 | 15 |

### Metriques dashboard
```
C5 = COUNTA(C8:C100)                    // Nombre total de deals
C6 = SUM(I8:I100)                       // Valeur totale pipeline
C7 = COUNTIF(F8:F100,"Prospection")     // Deals en prospection
C8 = COUNTIF(F8:F100,"Due Diligence")   // Deals en DD
C9 = COUNTIF(F8:F100,"Negociation")     // Deals en nego
C10 = COUNTIF(F8:F100,"Closing")        // Deals en closing
C11 = COUNTIF(F8:F100,"Gagnee")         // Deals gagnes
C12 = COUNTIF(F8:F100,"Perdue")         // Deals perdus
```

### Calcul valeur ponderee
```
K15 = I15*J15                           // Valeur * Probabilite
K16 = I16*J16
// ... pour chaque deal
```

### Colonnes
- **C**: Nom du deal
- **D**: Client
- **E**: Type (Cession/Acquisition/LBO)
- **F**: Statut
- **G**: Date debut
- **H**: Date cible closing
- **I**: Valeur estimee (k€)
- **J**: Probabilite (%)
- **K**: Valeur ponderee
- **L**: Conseiller lead
- **M**: Commentaires

### Implementation Alecia Numbers
- **Type**: Dashboard + Kanban
- **Features**: Drag & drop, graphique funnel, alertes dates

---

## 6. Buyer Seller CRM

**Fichier source:** `06_Buyer_Seller_CRM.xlsx`

### Description
Base de donnees des acheteurs potentiels et vendeurs pour le matching et le suivi relationnel.

### Structure
| Feuille | Dimensions | Formules |
|---------|------------|----------|
| Acheteurs | B2:P15 | 2 |
| Vendeurs | B2:P13 | 1 |

### Formules
```
// Acheteurs
C5 = COUNTA(C8:C500)                    // Nombre total acheteurs
C6 = COUNTIF(I8:I500,"Actif")           // Acheteurs actifs

// Vendeurs
C5 = COUNTA(C8:C500)                    // Nombre total vendeurs
```

### Colonnes Acheteurs
- **C**: Nom societe
- **D**: Contact principal
- **E**: Email
- **F**: Telephone
- **G**: Secteurs cibles
- **H**: Taille cible (CA)
- **I**: Statut (Actif/Inactif)
- **J**: Dernier contact
- **K**: Prochaine action
- **L**: Notes

### Implementation Alecia Numbers
- **Type**: Integration CRM existant
- **Features**: Synchronisation Convex, scoring, matching algorithmique

---

## 7. Teaser IM Tracking

**Fichier source:** `07_Teaser_IM_Tracking.xlsx`

### Description
Suivi des envois de teasers et memorandums d'information aux acheteurs potentiels.

### Structure
| Feuille | Dimensions | Formules |
|---------|------------|----------|
| Suivi Teasers IM | B2:P22 | 5 |

### Formules metriques
```
C7 = COUNTIF(D10:D200,"Teaser")         // Nombre teasers envoyes
C8 = COUNTIF(D10:D200,"IM")             // Nombre IM envoyes
C9 = COUNTA(C10:C200)                   // Total documents
C10 = COUNTIF(G10:G200,"Repondu")/COUNTA(G10:G200)  // Taux reponse
C11 = COUNTIF(J10:J200,"Signe")         // NDA signes
```

### Implementation Alecia Numbers
- **Type**: Tracker avec timeline
- **Features**: Envoi automatise, tracking ouvertures, relances

---

## 8. Deal Timeline

**Fichier source:** `08_Deal_Timeline.xlsx`

### Description
Planning detaille des etapes d'une transaction avec jalons et responsables.

### Structure
| Feuille | Dimensions | Formules |
|---------|------------|----------|
| Timeline | B2:N27 | 4 |

### Formules
```
C7 = COUNTIF(F10:F100,"Termine")        // Etapes terminees
F7 = IFERROR(COUNTIF(F10:F100,"Termine")/COUNTA(C10:C100),0)  // % avancement
C8 = COUNTIF(F10:F100,"En cours")       // Etapes en cours
C9 = COUNTIF(F10:F100,"A venir")        // Etapes a venir
```

### Colonnes
- **C**: Etape
- **D**: Description
- **E**: Responsable
- **F**: Statut
- **G**: Date debut prevue
- **H**: Date fin prevue
- **I**: Date reelle
- **J**: Duree (jours)
- **K**: Dependances
- **L**: Livrables

### Implementation Alecia Numbers
- **Type**: Gantt interactif
- **Features**: Drag & drop, dependances, integration calendrier

---

## 9. Fee Calculator

**Fichier source:** `09_Fee_Calculator.xlsx`

### Description
Calculateur d'honoraires M&A avec formule Lehman et generation de lettre d'engagement.

### Structure
| Feuille | Dimensions | Formules |
|---------|------------|----------|
| Calculateur Honoraires | B2:H33 | 15 |
| Lettre Engagement | B2:H45 | 0 |

### Formule Lehman (Double Lehman modifie)
```
// Valeur transaction
C13 = SUM(C9:C12)                       // Valorisation + Dette - Cash + Ajustements

// Retainer
C18 = C17*E17                           // Mensuel * Nombre mois

// Success fee par tranches
D22 = MIN(C13,1000)                     // 1er M€
E22 = C22*D22                           // 5% * Tranche 1

D23 = IF(C13>1000,MIN(C13-1000,1000),0) // 2eme M€
E23 = C23*D23                           // 4% * Tranche 2

D24 = IF(C13>2000,MIN(C13-2000,1000),0) // 3eme M€
E24 = C24*D24                           // 3% * Tranche 3

D25 = IF(C13>3000,C13-3000,0)           // Au-dela
E25 = C25*D25                           // 2% * Reste

E26 = SUM(E22:E25)                      // Total success fee

// Total honoraires
C32 = C29+C30+C31                       // Retainer + Success + Frais
C33 = IFERROR(C32/C13,0)                // % de la transaction
```

### Taux par tranche
| Tranche | Montant | Taux |
|---------|---------|------|
| 1er M€ | 0-1M€ | 5% |
| 2eme M€ | 1-2M€ | 4% |
| 3eme M€ | 2-3M€ | 3% |
| Au-dela | >3M€ | 2% |

### Implementation Alecia Numbers
- **Type**: Formulaire interactif
- **Features**: Calcul temps reel, generation PDF, historique simulations

---

## 10. Post-Deal Integration

**Fichier source:** `10_Post_Deal_Integration.xlsx`

### Description
Checklist et suivi des actions post-acquisition pour l'integration de la cible.

### Structure
| Feuille | Dimensions | Formules |
|---------|------------|----------|
| Integration | B2:K42 | 3 |

### Formules
```
C7 = COUNTA(C10:C200)                   // Total actions
F7 = IFERROR(C8/C7,0)                   // % completion
C8 = COUNTIF(F10:F200,"Termine")        // Actions terminees
```

### Categories d'integration
- **J+0 a J+30**: Actions immediates
  - Communication interne/externe
  - Securisation des actifs cles
  - Retention des talents cles
  
- **J+30 a J+90**: Integration operationnelle
  - Harmonisation processus
  - Integration SI
  - Synergies rapides
  
- **J+90 a J+180**: Optimisation
  - Synergies de couts
  - Cross-selling
  - Culture d'entreprise

### Implementation Alecia Numbers
- **Type**: Checklist avec phases
- **Features**: Templates par type d'acquisition, KPIs, alertes

---

## Architecture technique

### Stack recommandee
- **Frontend**: React + TypeScript
- **Spreadsheet**: Luckysheet (MIT license)
- **Charts**: Recharts (deja installe)
- **Forms**: React Hook Form + Zod
- **State**: Convex (deja en place)
- **Export**: xlsx.js + jsPDF

### Schema de donnees Convex

```typescript
// Tables a ajouter
numbers_templates: defineTable({
  name: v.string(),
  type: v.string(), // "checklist" | "calculator" | "spreadsheet" | "dashboard"
  category: v.string(),
  description: v.string(),
  schema: v.any(), // Structure du template
  formulas: v.array(v.object({
    cell: v.string(),
    formula: v.string(),
  })),
}),

numbers_documents: defineTable({
  templateId: v.id("numbers_templates"),
  dealId: v.optional(v.id("deals")),
  name: v.string(),
  data: v.any(), // Donnees du document
  createdBy: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
}),

numbers_calculations: defineTable({
  documentId: v.id("numbers_documents"),
  type: v.string(), // "fee" | "valuation" | etc.
  inputs: v.any(),
  outputs: v.any(),
  createdAt: v.number(),
}),
```

---

## Roadmap implementation

### Phase 1 - Fondations
1. Page hub Alecia Numbers
2. Integration Luckysheet
3. Fee Calculator (formulaire)
4. Due Diligence Checklist

### Phase 2 - Valorisation
5. Valuation Multiples
6. Comparable Companies
7. Financial Model 3-Statement

### Phase 3 - Pipeline & CRM
8. Deal Pipeline dashboard
9. Integration CRM existant
10. Teaser/IM Tracking

### Phase 4 - Integration
11. Deal Timeline (Gantt)
12. Post-Deal Integration
13. Export/Import Excel
14. Collaboration temps reel

---

*Documentation generee le 4 fevrier 2026 - Alecia Numbers v1.0*
