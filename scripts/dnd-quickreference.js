class DnDQuickReference {
    // Utilisation de constantes pour éviter les répétitions
    static ID = 'dnd-quick-reference';
    static activeDialog = null;
    
    // Création des templates une seule fois
    static TEMPLATES = {
        quickReference: `modules/${this.ID}/templates/quick-reference.hbs`,
        ruleCard: `modules/${this.ID}/templates/rule-card.hbs`
    };

    // Méthode d'initialisation principale
    static async initialize() {
        await this.loadRuleData();
        this.registerSettings();
        this.exposeAPI();
        this.addButton();
    }

    // Chargement des données de règles depuis le fichier JSON
    static async loadRuleData() {
        try {
            const response = await fetch(`modules/${this.ID}/data/rules.json`);
            if (!response.ok) throw new Error('Failed to load rules data');
            this.ruleData = await response.json();
            console.log(`${this.ID} | Rules data loaded successfully`);
        } catch (error) {
            console.error(`${this.ID} | Error loading rules data:`, error);
            this.ruleData = {};
        }
    }

    // Enregistrement des paramètres du module
    static registerSettings() {
        game.settings.register(this.ID, 'autoCloseDialogs', {
            name: game.i18n.localize('DNDQuickReferenceAutoCloseDialogs'),
            hint: game.i18n.localize('DNDQuickReferenceAutoCloseDialogsHint'),
            scope: 'client',
            config: true,
            type: Boolean,
            default: true
        });
        
    }

    static registerSettings() {
        game.settings.register(this.ID, 'autoCloseDialogs', {
            name: game.i18n.localize('DNDQuickReferenceAutoCloseDialogs'),
            hint: game.i18n.localize('DNDQuickReferenceAutoCloseDialogsHint'),
            scope: 'client',
            config: true,
            type: Boolean,
            default: true
        });
    
        game.settings.register(this.ID, 'buttonTab', {
            name: game.i18n.localize('DNDQuickReferenceButtonTab'),
            hint: game.i18n.localize('DNDQuickReferenceButtonTabHint'),
            scope: 'client',
            config: true,
            type: String,
            requiresReload: true,
            choices: {
                'actor': game.i18n.localize('DNDQuickReferenceTabActor'),
                'item': game.i18n.localize('DNDQuickReferenceTabItem'),
                'journal': game.i18n.localize('DNDQuickReferenceTabJournal'),
                'rollTable': game.i18n.localize('DNDQuickReferenceTabRollTable'),
                'cards': game.i18n.localize('DNDQuickReferenceTabCards'),
                'macro': game.i18n.localize('DNDQuickReferenceTabMacro'),
                'playlist': game.i18n.localize('DNDQuickReferenceTabPlaylist'),
                'compendium': game.i18n.localize('DNDQuickReferenceTabCompendium'),
                'none': game.i18n.localize('DNDQuickReferenceTabNone') 
            },
            default: 'actor'
        });
    }

    // Ajouter un bouton à l'onglet Journal
static addButton() {
    const buttonTab = game.settings.get(this.ID, 'buttonTab');

    const addButton = (app, html) => {
        const element = html instanceof jQuery ? html : $(html);
        const button = $(`
            <button class="dnd-quickref-button">
                <i class="fas fa-book-open"></i> D&D Rules
            </button>
        `);
        element.find('.directory-header').append(button);
        button.click(() => this.openQuickReference());
    };

    switch (buttonTab) {
        case 'actor':
            Hooks.on('renderActorDirectory', addButton);
            break;
        case 'item':
            Hooks.on('renderItemDirectory', addButton);
            break;
        case 'journal':
            Hooks.on('renderJournalDirectory', addButton);
            break;
        case 'rollTable':
            Hooks.on('renderRollTableDirectory', addButton);
            break;
        case 'cards':
            Hooks.on('renderCardsDirectory', addButton);
            break;
        case 'macro':
            Hooks.on('renderMacroDirectory', addButton);
            break;
        case 'playlist':
            Hooks.on('renderPlaylistDirectory', addButton);
            break;
        case 'compendium':
            Hooks.on('renderCompendiumDirectory', addButton);
            break;
        default:
            Hooks.on('renderJournalDirectory', addButton);
            break;
    }
}

    // Créationd de l'API
    static exposeAPI() {
        // Rendre l'API disponible globalement
        window.DnDQuickReference = {
          open: (category = null) => this.openQuickReference(category)
        };
        
        console.log("D&D Quick Reference API initialized");
      }

    // Ouverture de la fenêtre principale de référence rapide
    static async openQuickReference() {
        if (!this.ruleData || Object.keys(this.ruleData).length === 0) {
            await this.loadRuleData();
        }
        new QuickReferenceDialog(this.ruleData).render(true);
    }

    // Gestion des boîtes de dialogue (fermeture automatique)
    static handleDialog(dialog) {
        const autoClose = game.settings.get(this.ID, 'autoCloseDialogs');
        
        if (autoClose && this.activeDialog && this.activeDialog !== dialog) {
            this.activeDialog.close();
        }
        this.activeDialog = dialog;
    }
}

class QuickReferenceDialog extends Application {
    constructor(ruleData) {
        super();
        this.ruleData = ruleData;
    }

    // Configuration des options de la fenêtre principale
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            title: game.i18n.localize('DNDQuickReferenceTitle'),
            template: DnDQuickReference.TEMPLATES.quickReference,
            width: 900,
            height: 700,
            resizable: true,
            classes: ['dnd-quickreference']
        });
    }

    // Préparation des données pour le template
    async getData() {
        // Transformation des données pour les rendre utilisables par le template
        return {
            categories: Object.keys(this.ruleData).map(id => ({
                id,
                title: game.i18n.localize(`DNDQuickReferenceCategories${id}`),
                description: game.i18n.localize(`DNDQuickReferenceCategories${id}Description`),
                rules: this._getRules(this.ruleData[id].rules),
                subcategories: this._getSubcategories(id, this.ruleData[id].subcategories)
            }))
        };
    }

    // Extraction des règles avec localisation (méthode d'aide)
    _getRules(rules = []) {
        return rules.map(rule => this._localizeRule(rule));
    }

    // Extraction des sous-catégories (méthode d'aide)
    _getSubcategories(categoryId, subcategories) {
        if (!subcategories) return [];
        
        return Object.keys(subcategories).map(subId => ({
            id: subId,
            title: game.i18n.localize(`DNDQuickReferenceCategories${categoryId}Subcategories${subId}`),
            description: game.i18n.localize(`DNDQuickReferenceCategories${categoryId}Subcategories${subId}Description`),
            rules: this._getRules(subcategories[subId].rules)
        }));
    }

    // Localisation d'une règle individuelle
    _localizeRule(rule) {
        if (!rule) return null;
        
        return {
            ...rule,
            title: game.i18n.localize(rule.title),
            subtitle: game.i18n.localize(rule.subtitle),
            description: game.i18n.localize(rule.description),
            reference: game.i18n.localize(rule.reference),
            bullets: rule.bullets.map(bullet => game.i18n.localize(bullet))
        };
    }

    // Gestion des événements d'interface utilisateur
    activateListeners(html) {
        super.activateListeners(html);
        
        // Événement de clic sur une carte de règle
        html.find('.rule-card').click(event => {
            const ruleCard = $(event.currentTarget);
            const ruleData = {
                ruleId: ruleCard.data('ruleId'),
                categoryId: ruleCard.closest('.category').data('categoryId'),
                subcategoryId: null
            };
            
            const subcategoryContainer = ruleCard.closest('.subcategory');
            if (subcategoryContainer.length) {
                ruleData.subcategoryId = subcategoryContainer.data('subcategoryId');
            }
            
            this._showRuleDetails(ruleData.categoryId, ruleData.subcategoryId, ruleData.ruleId);
        });
    }

    // Affichage des détails d'une règle dans une boîte de dialogue
    async _showRuleDetails(categoryId, subcategoryId, ruleId) {
        // Recherche de la règle dans les données
        const rule = this._findRule(categoryId, subcategoryId, ruleId);
        
        if (!rule) {
            ui.notifications.warn(`Rule not found: category=${categoryId}, subcategory=${subcategoryId}, rule=${ruleId}`);
            return;
        }
        
        // Localisation et affichage de la règle
        const localizedRule = this._localizeRule(rule);
        const content = await renderTemplate(DnDQuickReference.TEMPLATES.ruleCard, localizedRule);
        
        const dialog = new Dialog({
            title: localizedRule.title,
            content: content,
            buttons: {},
            position: {
                width: 600,
                height: 400,
                top: window.innerHeight / 2 - 200,
                left: window.innerWidth / 2 - 300
            }
        }, {
            classes: ['dnd-quickref-dialog'],
            id: `dnd-quickref-${categoryId}-${ruleId}`
        });

        // Gestion de la nouvelle boîte de dialogue
        DnDQuickReference.handleDialog(dialog);
        dialog.render(true);
    }
    
    // Recherche d'une règle spécifique dans les données
    _findRule(categoryId, subcategoryId, ruleId) {
        try {
            if (subcategoryId) {
                return this.ruleData[categoryId].subcategories[subcategoryId].rules.find(r => r.id === ruleId);
            } else {
                return this.ruleData[categoryId].rules.find(r => r.id === ruleId);
            }
        } catch (error) {
            console.error(`Error finding rule: ${error}`);
            return null;
        }
    }
}

// Initialisation du module lors du chargement de Foundry
Hooks.once('init', async () => {
    await DnDQuickReference.initialize();
});