## Clepsydre 1.0.0

Première version de Clepsydre, l'app de bureau qui chronomètre votre travail par projet et vous dit combien facturer. Tout reste sur votre ordinateur.

### Points clés

- **Chrono par projet** : démarrage et arrêt en un clic, description facultative, la session en cours survit à la fermeture de l'app.
- **Frise de la journée** et chiffres du jour, de la semaine et du montant à facturer.
- **Feuille de temps** de la semaine (projets × jours) avec objectif hebdomadaire et heures par jour.
- **Projets** avec client, couleur, taux horaire, temps facturable ou non et budget en heures (alerte à 85 % et au dépassement).
- **Rapport** par semaine ou par mois, répartition par projet et **export CSV** prêt pour Excel ou LibreOffice, avec arrondi optionnel.
- **Saisie manuelle**, modification et suppression des sessions (avec annulation).
- **Sauvegarde et restauration** de toutes les données en JSON.
- Thèmes clair et sombre Material You, interface en français, 100 % hors ligne.

### Quel fichier télécharger ?

| Système | Fichier | Pour qui |
|---|---|---|
| Windows | `Clepsydre-Setup-1.0.0.exe` | Installation classique avec raccourcis et désinstallation. |
| Windows | `Clepsydre-1.0.0-portable.exe` | Un seul fichier à lancer, sans installation (clé USB, poste sans droits admin). |
| Linux | `Clepsydre-1.0.0-linux-x86_64.AppImage` | Toutes distributions : rendez-le exécutable (`chmod +x`) puis lancez-le. |
| Linux | `Clepsydre-1.0.0-linux-amd64.deb` | Debian, Ubuntu et dérivées : `sudo apt install ./Clepsydre-1.0.0-linux-amd64.deb` |

> L'exécutable Windows n'est pas signé : si SmartScreen s'affiche, cliquez sur **Informations complémentaires** puis **Exécuter quand même**. Les fichiers sont compilés par GitHub Actions à partir du code de ce dépôt.
