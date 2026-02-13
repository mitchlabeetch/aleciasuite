# LogoGen Studio - Guide d'utilisation

## 🎨 Vue d'ensemble

Le **LogoGen Studio** est un outil créé pour générer des visuels LinkedIn professionnels pour vos opérations M&A fermées. Accessible à l'adresse **alecia.markets/studio**, cet outil permet de créer des assets haute qualité en quelques clics.

## 🚀 Accès

```
URL: https://alecia.markets/studio
Route: /[locale]/studio
```

## ✨ Fonctionnalités principales

### 1. **Sélection d'opération**
- Menu déroulant avec toutes les opérations de la table `transactions` Convex
- Remplissage automatique des logos, type de deal et année
- Support des logos Client et Acquéreur

### 2. **Formats disponibles**
- **Carré**: 1200x1200px (optimal pour LinkedIn carrousel)
- **Paysage**: 1200x800px (optimal pour post unique)

### 3. **Thèmes prédéfinis**
- **Deep Corporate**: Navy Blue / Dark Slate
- **Midnight**: Pure Black / Deep Charcoal  
- **Forest**: Dark Emerald / Night Green
- **Bordeaux**: Rich Maroon / Dark Chocolate
- **Subtle Sand**: Soft Beige / Warm Grey (texte foncé)

### 4. **Personnalisation avancée**

#### Couleurs
- Sélecteurs de couleur pour les côtés gauche et droit
- Dégradé diagonal à 115deg pour un effet moderne

#### Typographie
- **Bierstadt**: Police native Alecia
- **Inter**: Clean & moderne
- **Playfair Display**: Classique & premium
- **Montserrat**: Bold
- **Sora**: Tech
- **Work Sans**: Professionnel

#### Overrides manuels
- Champ "Type de deal" pour personnaliser (ex: "Levée de fonds", "Cession")
- Champ "Année" pour modifier l'année affichée

#### Message en bas (optionnel)
- Sélection d'icône Lucide (Phone, Mail, Globe, etc.)
- Champ texte libre (ex: "Contactez-nous", "alecia.markets")

### 5. **Aperçu en temps réel**
- Canvas responsive qui reflète tous les changements instantanément
- Design "Split-screen Diagonal" avec:
  - Logo Alecia (blanc) en haut
  - Logos des entreprises au centre avec séparateur "&" (30% opacity)
  - Type de deal et année en bas du centre
  - Message optionnel en bas de page

### 6. **Export HD**
- Bouton "Télécharger l'asset HD"
- Export PNG avec `pixelRatio: 3` (Retina quality)
- Gestion CORS pour les images CDN (`crossOrigin="anonymous"`)
- Nom de fichier: `alecia-deal-[slug]-[timestamp].png`

### 7. **Générateur de légende LinkedIn**
- Bouton "Copier la légende LinkedIn"
- Template automatique avec:
  - Noms des entreprises
  - Type d'opération
  - Année
  - Secteur
  - Hashtags M&A
- Copie directe dans le presse-papiers

## 🏗️ Architecture technique

### Stack
- **Framework**: Next.js App Router
- **Styling**: Tailwind CSS
- **Backend**: Convex (table `transactions`)
- **UI Components**: Shadcn/UI (Select, Button, Input, Label)
- **Icons**: Lucide-React
- **Export**: html-to-image (toPng)

### Fichiers clés
```
apps/website/src/app/[locale]/studio/page.tsx    # Page principale
convex/transactions.ts                             # Queries Convex
convex/schema.ts                                   # Schéma de données
```

### Données requises (Convex `transactions`)
```typescript
{
  _id: Id<"transactions">,
  slug: string,
  clientName: string,
  clientLogo?: string,
  acquirerName?: string,
  acquirerLogo?: string,
  mandateType: string,     // "Sell-side", "Buy-side", etc.
  year: number,
  sector: string,
  // ... autres champs
}
```

## 🎯 Workflow typique

1. **Accéder au Studio**: Naviguer vers `/studio`
2. **Sélectionner un deal**: Choisir dans le menu déroulant
3. **Choisir le format**: Carré ou Paysage
4. **Personnaliser**:
   - Sélectionner un thème ou ajuster les couleurs manuellement
   - Changer la typographie
   - Ajuster le type de deal ou l'année si nécessaire
   - Ajouter un message en bas (optionnel)
5. **Prévisualiser**: Vérifier l'aperçu en temps réel
6. **Télécharger**: Cliquer sur "Télécharger l'asset HD"
7. **Copier la légende**: Cliquer sur "Copier la légende LinkedIn"
8. **Publier sur LinkedIn**: Utiliser l'asset et la légende

## 🎨 Design System

### Palette "Premium Corporate Tech"
- High-contrast pour la lisibilité
- Dégradés sophistiqués
- Typographies premium
- Logos sur fond blanc pour neutralité

### Layout "Split-screen Diagonal"
```css
background: linear-gradient(115deg, var(--color-left) 50%, var(--color-right) 50%)
```

### Hiérarchie visuelle
1. **Top**: Logo Alecia (signature)
2. **Center**: Logos des entreprises + séparateur "&"
3. **Bottom-center**: Type de deal + Année
4. **Bottom**: Message optionnel

## 🔧 Maintenance

### Ajouter un nouveau thème
Modifier `THEME_PRESETS` dans `page.tsx`:
```typescript
{
  id: "nouveau-theme",
  name: "Nouveau Thème",
  left: "#HEXCOLOR1",
  right: "#HEXCOLOR2",
  textColor: "#FFFFFF" // ou "#000000" pour fond clair
}
```

### Ajouter une police
Modifier `TYPOGRAPHY_OPTIONS`:
```typescript
{
  id: "ma-police",
  name: "Ma Police",
  fontFamily: "Ma Police, sans-serif"
}
```
⚠️ Assurer que la police est chargée dans `layout.tsx`

## 🐛 Troubleshooting

### Problème: Image "tainted canvas"
**Solution**: Vérifier que `crossOrigin="anonymous"` est présent sur toutes les balises `<img>`

### Problème: Export flou
**Solution**: Augmenter `pixelRatio` dans la fonction `toPng()` (actuellement à 3)

### Problème: Logos déformés
**Solution**: Vérifier que `object-fit: contain` est appliqué aux conteneurs de logos

## 📝 Notes

- Le studio fonctionne entièrement côté client ("use client")
- Les transactions sont chargées via `useQuery` de Convex
- L'aperçu utilise un système de scaling CSS pour rester responsive
- L'export capture le DOM réel à la résolution native (1200x1200 ou 1200x800)

---

**Créé pour Alecia Markets - M&A Advisory**  
Version 1.0 - Janvier 2026
