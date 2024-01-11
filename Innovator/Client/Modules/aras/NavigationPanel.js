import Sidebar from '../components/sidebar';
import ContextMenu from '../components/contextMenu';
import utils from '../core/utils';

const pinUrl = 'svg-pinnedoff';
const unPinUrl = 'svg-pinnedon';
const secondaryMenuClass = 'aras-navigation-panel__secondary-menu';
const secondaryMenuHiddenClass = secondaryMenuClass + '_hidden';
const disabledRowHighlightingClass =
	'aras-navigation-panel_row-highlighting-disabled';

function navFormatter(nav, item) {
	const isDashboardItem = item.value.formId || item.value.startPage;

	if (item.value.itemTypeId || isDashboardItem) {
		const leafTemplate = nav.templates.getDefaultTemplate(item);
		const nodeClassList = isDashboardItem
			? 'aras-nav-leaf-ico'
			: 'aras-button aras-button_c aras-nav-leaf-ico';
		const nodeIconUrl = isDashboardItem
			? '../images/OpenInTab.svg'
			: '../images/ExecuteSearch.svg';

		leafTemplate.push(
			Inferno.createVNode(
				Inferno.getFlagsForElementVnode('span'),
				'span',
				nodeClassList,
				ArasModules.SvgManager.createInfernoVNode(nodeIconUrl),
				utils.infernoFlags.unknownChildren
			)
		);

		return leafTemplate;
	}
}

export default class NavigationPanel extends Sidebar {
	togglePin(pinned) {
		super.togglePin(pinned);
		this.render();
	}

	toggleVisibility(visible) {
		super.toggleVisibility(visible);
		const splitter = this.nextElementSibling;
		splitter.classList.toggle('aras-hide', !this.isVisible);
		const navButtonID =
			'com.aras.innovator.cui_default.mwh_header_navigation_button';
		const toolbar = document.querySelector('aras-toolbar');
		const navButton = toolbar.data.get(navButtonID);
		if (this.isVisible !== navButton.state) {
			toolbar.data.set(
				navButtonID,
				Object.assign({}, navButton, { state: this.isVisible })
			);
			toolbar.render();
		}
	}

	render() {
		const secondaryMenuData = this._getSecondaryMenuData();
		const baseUrl = window.location.href.replace(window.location.hash, '');
		const pinIconUrl = baseUrl + '#' + (this.isPinned ? unPinUrl : pinUrl);

		this.html`<div class="aras-navigation-panel__header">
			<button class="${'aras-button aras-button_c ' +
				(secondaryMenuData ? '' : 'aras-hide')}" onclick="${() => {
			this._hideSecondaryMenu();
		}}">
				${ArasModules.SvgManager.createHyperHTMLNode('../images/BackFull.svg', {
					class: 'aras-button__icon'
				})}
			</button>
			${ArasModules.SvgManager.createHyperHTMLNode(
				secondaryMenuData && secondaryMenuData.icon,
				{ class: 'aras-navigation-panel__header-icon' }
			)}
			<span class="aras-navigation-panel__header-title">
				${
					secondaryMenuData
						? secondaryMenuData.pluralLabel
						: aras.getResource('', 'common.contents')
				}
			</span>
			<span class="aras-navigation-panel__pin-icon aras-button aras-button_c" onclick="${() =>
				this.togglePin()}">
				<svg class="aras-button__icon"><use href="${pinIconUrl}"></use></svg>
			</span>
		</div>
		<!-- Start TOC Searchbar Modifications -->
		<div class="filterContainer">
				<input type="text" id="filterTOC" class="aras-input" onkeyup=${e => this._filterTOC(e)} onfocus=${this._focusFilter} placeholder="Filter..." />
				<input type="image" src="..\\images\\Delete.svg" id="clearFilterButton" class="aras-button" onclick=${e => this._clearFilter(e)} />
		</div>
		<!-- End TOC Searchbar Modifications -->
		<aras-nav class="aras-nav-toc" onconnected=${e => this._initTOC(e)}></aras-nav>
		<div class="${secondaryMenuClass +
			' ' +
			(secondaryMenuData ? '' : secondaryMenuHiddenClass)}">
			<button
				class="aras-button aras-navigation-panel__secondary-menu-create-button"
				disabled=${!secondaryMenuData || !secondaryMenuData.canAdd}
				onclick="${() => this._createNewItem(secondaryMenuData.itemTypeId)}"
			>
				<svg class="aras-button__icon"><use href="${baseUrl +
					'#svg-createitem'}"></use></svg>
				<span class="aras-button__text">
					${aras.getResource(
						'',
						'navigation_panel.secondary_menu.create_new',
						secondaryMenuData && secondaryMenuData.singularLabel
					)}
				</span>
			</button>
			<button
				class="aras-button aras-navigation-panel__secondary-menu-search-button"
				onclick="${() => this._searchItemType(secondaryMenuData.itemTypeId)}"
			>
				<svg class="aras-button__icon"><use href="${baseUrl +
					'#svg-executesearch'}"></use></svg>
				<span class="aras-button__text">
					${aras.getResource(
						'',
						'navigation_panel.secondary_menu.search',
						secondaryMenuData && secondaryMenuData.pluralLabel
					)}
				</span>
			</button>
		</div>`;
	}

	connectedCallback() {
		super.connectedCallback();
		this.classList.add('aras-navigation-panel', disabledRowHighlightingClass);
		this.popupMenu = new ContextMenu();
		this._initContextMenuListeners();
		const observer = new MutationObserver(mutations => {
			const navPanel = mutations[0].target;
			const panelWidth = navPanel.style.width;
			navPanel.nextElementSibling.style.left = panelWidth;
		});

		observer.observe(this, {
			attributes: true,
			attributeFilter: ['style']
		});
		this.render();
	}

	// Start TOC Searchbar Modifications

	hideAllTOCNodes() {
    
		const val = document.getElementById('filterTOC').value;
		document.querySelectorAll('.aras-nav__row').forEach(function(element){
			element.closest('li').style.display = 'none';
		});
		document.querySelectorAll('.aras-nav__child').forEach(function(element){
			if (element.querySelector('.aras-nav__label').textContent.includes(val)){   
				var cnt= element.getAttribute("aria-level");
				element.style.display = 'flex';
				if(cnt == 4){
					element.closest('.aras-nav__parent').style.display = 'list-item';
					element.closest('.aras-nav__parent').parentElement.closest('.aras-nav__parent').style.display = 'list-item';
					element.closest('.aras-nav__parent').parentElement.closest('.aras-nav__parent').parentElement.closest('.aras-nav__parent').style.display = 'list-item';
				}   
				if(cnt == 3){
					element.closest('.aras-nav__parent').style.display = 'list-item';
					element.closest('.aras-nav__parent').parentElement.closest('.aras-nav__parent').style.display = 'list-item';
				}
				if(cnt == 2){
					element.closest('.aras-nav__parent').style.display = 'list-item';
				}
			}
		});
	}
		
		_focusFilter() {
			var filter = document.getElementById("filterTOC");
			var val = filter.value;
			if (val.length == 0)
			{
				var alreadyThereElements = document.querySelectorAll('.aras-nav-toc span.aras-nav__parent_expanded');
				alreadyThereElements.forEach(function(element){
					element.classList.add('hadbefore_aras-nav__parent_expanded');
				});
				
			}
		}
		
		_filterTOC() {
			
			var filter = document.getElementById("filterTOC");
			var val = filter.value;     
			this.hideAllTOCNodes();
		}
		
		_clearFilter() {
			document.getElementById('filterTOC').value = '';
			this.hideAllTOCNodes();
		}

	// End TOC Searchbar Modifications

	_initContextMenuListeners() {
		const contextMenuDom = this.popupMenu.dom;
		contextMenuDom.addEventListener('contextMenuShow', () => {
			this.classList.remove(disabledRowHighlightingClass);
		});
		contextMenuDom.addEventListener('contextMenuClose', () => {
			this.classList.add(disabledRowHighlightingClass);
			if (!this.isPinned) {
				this._focusOutHandler();
			}
		});
		contextMenuDom.addEventListener('click', () => {
			this._hideIfNotPinned();
		});
	}

	_initTOC(e) {
		this.nav = e.target;
		this.nav.formatter = navFormatter.bind(null, this.nav);
		this.nav.on('click', (itemKey, event) => {
			const dataItem = this.nav.data.get(itemKey);
			const isNewTabOpened =
				dataItem.formId ||
				dataItem.startPage ||
				event.target.closest('.aras-button.aras-nav-leaf-ico');
			if (isNewTabOpened) {
				this._hideIfNotPinned();
			} else if (dataItem.itemTypeId) {
				this._showSecondaryMenu(itemKey);
			}
		});
	}

	_isElementInSidebar(element) {
		return (
			super._isElementInSidebar(element) ||
			(element && this.popupMenu.dom.contains(element))
		);
	}

	_hideIfNotPinned() {
		if (!this.isPinned) {
			this.toggleVisibility(false);
			document.documentElement.focus(); // for correct work of sidebar in IE and FF
		}
	}

	_getSecondaryMenuData() {
		const navItemKey = this._secondaryMenuItemKey;
		if (!navItemKey || !this.nav.data.has(navItemKey)) {
			return null;
		}

		const data = this.nav.data.get(navItemKey);
		const itemTypeNode = aras.getItemTypeDictionary(data.itemTypeId, 'id');
		if (itemTypeNode.isError()) {
			return null;
		}
		const itemTypeName = aras.getItemTypeName(data.itemTypeId);
		const singularLabel = itemTypeNode.getProperty('label') || itemTypeName;
		const pluralLabel =
			itemTypeNode.getProperty('label_plural') || singularLabel;
		const canAdd = aras.getPermissions('can_add', data.itemTypeId);

		return {
			icon: data.icon,
			singularLabel,
			pluralLabel,
			itemTypeId: data.itemTypeId,
			canAdd
		};
	}

	_showSecondaryMenu(itemKey) {
		this._secondaryMenuItemKey = itemKey;
		this.render();
	}

	_hideSecondaryMenu() {
		delete this._secondaryMenuItemKey;
		this.render();
		this._setFocus();
	}

	_createNewItem(itemTypeId) {
		return aras.uiNewItemExAsync(itemTypeId).then(() => {
			this._hideIfNotPinned();
		});
	}

	_searchItemType(itemTypeId) {
		return Promise.resolve(window.arasTabs.openSearch(itemTypeId)).then(() => {
			this._hideIfNotPinned();
		});
	}
}

NavigationPanel.define('aras-navigation-panel');
