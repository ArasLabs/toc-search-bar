// eslint-disable-next-line
// @ts-nocheck
import '../components/nav/nav';
import Sidebar from '../components/sidebar';
import ContextMenu from '../components/contextMenu';
import alertModule from '../components/alert';
import './NavigationPanelTabs';
import utils from '../core/utils';
import secondaryMenu from './secondaryMenu';
import { getFavoritePanel } from './FavoritePanel';
import { itemType as itemTypeMetadata } from 'metadata';
import { commands } from 'cui';
import { favorites as favoriteMethods } from 'store';
import { wire } from 'hyperhtml';
import * as Inferno from 'inferno';
import { SvgManager, getResource } from 'core';
import {
	contentTabId,
	defaultTabs,
	favoriteTabId
} from './sidebarDataConverter';
import type { Favorite } from '../store/storeTypes';

const icons = {
	back: '../images/BackFull.svg',
	close: '../images/Close.svg',
	defaultItemType: '../images/DefaultItemType.svg',
	search: '../images/ExecuteSearch.svg',
	open: '../images/OpenInTab.svg',
	pinned: '../images/PinnedOn.svg',
	savedSearch: '../images/SavedSearchOverlay.svg',
	unpinned: '../images/PinnedOff.svg',
	more: '../images/More.svg'
};

SvgManager.enqueue(Object.values(icons));

const disabledRowHighlightingClass =
	'aras-navigation-panel_row-highlighting-disabled';

function navFormatter(nav, item) {
	const itemValue = item.value;
	if (itemValue.children) {
		return null;
	}

	const isDashboardItem = itemValue.dashboard;
	if (itemValue.itemTypeId || isDashboardItem) {
		const leafTemplate = nav.templates.getDefaultTemplate(item);
		const src = isDashboardItem ? icons.open : icons.search;
		const image = Inferno.createVNode(
			Inferno.getFlagsForElementVnode('aras-image'),
			'aras-image',
			'aras-nav-leaf-ico-image',
			null,
			utils.infernoFlags.unknownChildren,
			{
				'aria-hidden': true,
				src
			}
		);
		const nodeClassList = isDashboardItem
			? 'aras-nav-leaf-ico'
			: 'aras-button aras-button_c aras-nav-leaf-ico';
		leafTemplate.push(
			Inferno.createVNode(
				Inferno.getFlagsForElementVnode('span'),
				'span',
				nodeClassList,
				image,
				utils.infernoFlags.unknownChildren
			)
		);

		return leafTemplate;
	}

	return null;
}

function getFavoriteCategories(itemTypeName, options) {
	const favorites = options.favorites;
	const favoritesFilterCriteria = (favoriteItem) => {
		return (
			favoriteItem.quickAccessFlag === '1' &&
			favoriteItem.contextType === itemTypeName
		);
	};
	const [favoriteSearches, favoriteItems] = ['Search', 'Item'].map((type) =>
		favoriteMethods.filterFavorites(favorites, type, favoritesFilterCriteria)
	);

	const favoriteCategories = [];
	if (favoriteSearches.length) {
		const label = getResource(
			'navigation_panel.secondary_menu.favorite_searches'
		);
		favoriteCategories.push({
			icon: options.icon,
			overlayIcons: [icons.savedSearch],
			unpinIcon: icons.close,
			label,
			items: favoriteSearches
		});
	}
	if (favoriteItems.length) {
		favoriteCategories.push({
			icon: options.icon,
			label: options.pluralLabel,
			items: favoriteItems
		});
	}
	return favoriteCategories;
}

async function getItemTypeData(itemTypeId) {
	const itemType = await itemTypeMetadata.getItemType(itemTypeId, 'id');
	const itemTypeName = itemType.name;
	const singularLabel = itemType.label || itemTypeName;
	const propertiesWithKeyedName =
		itemTypeMetadata.getKeyedNameConfiguration(itemType);
	const newCommand = createCommand('OpenNewItem', itemType);
	const canAdd = newCommand.canExecute();
	const openForbidden = window.isFunctionDisabled(itemTypeName, 'Open');
	const isQuickSearchDisabled =
		openForbidden || !propertiesWithKeyedName.length;

	return {
		canAdd,
		isQuickSearchDisabled,
		itemType,
		itemTypeName,
		singularLabel
	};
}

function createCommand(commandName, itemType, options = {}) {
	const itemTypeName = itemType?.name;

	return commands.commandFactory(commandName, {
		itemType,
		itemTypeName,
		location: 'MainWindowView',
		...options
	});
}

export default class NavigationPanel extends Sidebar {
	currentTab = contentTabId;
	staticTabs = defaultTabs.map((tab) => tab.id);
	nav = document.createElement('aras-nav');
	tabs = document.createElement('aras-navigation-panel-tabs');
	topScroll = null;

	state: {
		secondaryMenuItemTypeId: string | null;
		secondaryMenuData: {
			itemTypeId: string;
		} | null;
		favorites: Record<string, Favorite>;
	} = {
		secondaryMenuItemTypeId: null,
		secondaryMenuData: null,
		favorites: {}
	};

	togglePin(pinned) {
		super.togglePin(pinned);
		this.render();
	}

	toggleVisibility(visible) {
		super.toggleVisibility(visible);
		const splitter = this.nextElementSibling;
		const isVisible = this.isVisible;
		splitter.classList.toggle('aras-hide', !isVisible);
		if (isVisible && this.isPinned) {
			setTimeout(() => {
				this.focus();
			});
		}
	}

	focus() {
		if (!this.state.secondaryMenuItemTypeId) {
			return super.focus();
		}

		const quickSearch = this.querySelector(
			'.aras-secondary-menu__quick-search:not([disabled])'
		);

		if (quickSearch) {
			quickSearch.focus();
		} else {
			const navHeader = this.querySelector('.aras-navigation-panel__header');
			navHeader.focus();
		}
	}

	#createHeaderIcon(src) {
		return wire(this, ':headerIcon')`<aras-image
			aria-hidden="true"
			src="${src}"
			class="aras-navigation-panel__header-icon"
		/>`;
	}

	#createBackButton() {
		const backTitle = getResource(
			'navigation_panel.secondary_menu.back_to_contents'
		);

		return wire(this, ':backButton')`<button
			class="${'aras-button aras-button_c'}"
			onclick="${() => this._hideSecondaryMenu()}"
			title="${backTitle}"
			>
			<aras-image
				aria-hidden="true"
				class="aras-button__icon"
				src="${icons.back}"
			/>
		</button>`;
	}

	#createHeader({
		title,
		iconSrc
	}: {
		title: string;
		iconSrc: string;
	}): HTMLElement {
		const isSecondaryMenu = this.currentTab === 'secondary-tab';
		const pinIcon = this.isPinned ? icons.pinned : icons.unpinned;

		const backButton = isSecondaryMenu ? this.#createBackButton() : null;
		const headerIcon = iconSrc ? this.#createHeaderIcon(iconSrc) : null;
		const favoriteMenuIcon =
			this.currentTab === favoriteTabId
				? wire()`
					<span class="aras-navigation-panel__favorite-menu-icon aras-button aras-button_c">
						<aras-image aria-hidden="true" class="aras-button__icon" src="${icons.more}" />
					</span>`
				: null;

		return wire(this, ':header')`
			<div class="aras-navigation-panel__header" tabindex="0" aria-label="${title}">
				${backButton}
				${headerIcon}
				<span class="aras-navigation-panel__header-title">
					${title}
				</span>
				${favoriteMenuIcon}
				<span
					class="aras-navigation-panel__pin-icon aras-button aras-button_c"
					onclick="${() => this.togglePin()}"
				>
					<aras-image aria-hidden="true" class="aras-button__icon" src="${pinIcon}" />
				</span>
			</div>`;
	}

	#createSearchBar(): HTMLElement {
		return wire(this, ':searchbar')`
		<div class="filterContainer">
			<input type="text" id="filterTOC" class="aras-input" onkeyup="${(e) => this._filterTOC(e)}" onfocus="${() => this._focusFilter()}" placeholder="Filter..." />
			<input type="image" src="..\\images\\Delete.svg" id="clearFilterButton" class="aras-button" onclick="${(e) => this._clearFilter(e)}" />
		</div>
		`
	}

	#getCurrentTab(): { title: string; component: HTMLElement } {
		switch (this.currentTab) {
			case contentTabId:
				return {
					title: getResource('common.contents'),
					component: this.nav
				};
			case favoriteTabId:
				return {
					title: getResource('common.favorites'),
					component: getFavoritePanel(this)
				};
			default:
				return {
					title: this.state.secondaryMenuData?.pluralLabel,
					component: secondaryMenu(this)
				};
		}
	}

	render() {
		this.state.secondaryMenuData = this._getSecondaryMenuData();
		const secondaryMenuData = this.state.secondaryMenuData;

		const { title, component } = this.#getCurrentTab();

		this.html`
			${this.#createHeader({
				title,
				iconSrc: secondaryMenuData?.icon
			})}
			${this.#createSearchBar()}
			${this.tabs}
			${component}
		`;

		if (this.topScroll !== null) {
			this.nav.scrollTop = this.topScroll;
			if (this.currentTab === contentTabId) {
				this.topScroll = null;
			}
		}
	}

	connectedCallback() {
		super.connectedCallback();
		this.classList.add('aras-navigation-panel', disabledRowHighlightingClass);
		this.setAttribute('role', 'navigation');
		this.popupMenu = new ContextMenu();
		this.secondaryPopupMenu = new ContextMenu();
		this._initContextMenuHandlers();
		this._initContextMenuListeners();
		const observer = new MutationObserver((mutations) => {
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

	showAllTOCNodes() {
		$('.aras-nav').each(function() {
			$(this).find('*').not('.aras-nav-leaf-ico').show();
			// The icons flagged with the class 'aras-nav-leaf-ico' are the search icons that appear when you hover over an ItemType in the TOC
			// Due to some css quirk, calling the show() function on these items was inproperly setting the style attribute of these elements to 'display: "inline-block"'
			// Because of this, we need to specifically set the style for these elements like so.
			// TODO: Maybe it's best to avoid using hide()/show() entirely and we should just be doing direct style manipulation like this?
			$(this).find('.aras-nav-leaf-ico').attr("style", "");
		})

		var elements = $('.aras-nav-toc').find("span").parents('.aras-nav__parent_expanded').not('.hadbefore_aras-nav__parent_expanded');
		elements.removeClass('aras-nav__parent_expanded');	
	}
		
	hideAllTOCNodes() {
		$('.aras-nav').each(function() {
			$(this).find('*').hide();
		});
	}
	
	showParentsUntilRootTOC(val) {
		$('.aras-nav-toc').find("span:contains('" + val + "')").show();
		$('.aras-nav-toc').find("span:contains('" + val + "')").parentsUntil(".aras-nav").show();
		$('.aras-nav-toc').find("span:contains('" + val + "')").parentsUntil(".aras-nav").children('div,svg,img').show();
		$('.aras-nav-toc').find("span:contains('" + val + "')").parentsUntil(".aras-nav").children('div,svg,img').find('*').show();
		$('.aras-nav-toc').find("span:contains('" + val + "')").parentsUntil(".aras-nav").children('.aras-nav__row__icon').attr("style", ""); // We're not using show() for the same reason listed in the comment in the showALlTOCNodes() function above
		$('.aras-nav-toc').find("span:contains('" + val + "')").parentsUntil(".aras-nav").children('.aras-nav__row__icon').find("*").show();
		$('.aras-nav-toc').find("span:contains('" + val + "')").parents('.aras-nav__parent').addClass('aras-nav__parent_expanded');
	}

	_clearFilter() {
		var tValue = $('#filterTOC').val();
			
		if (tValue != null && tValue != '')
		{
			$('#filterTOC').val('');
			this.showAllTOCNodes();
		}	
		
		//filter is already cleared -> mark expanded TOC nodes
		if (tValue.length == 0)
		{	
			var alreadyThereElements = $('.aras-nav-toc').find('span').parents('.aras-nav__parent_expanded');
			alreadyThereElements.addClass('hadbefore_aras-nav__parent_expanded');
		}
	}

	_focusFilter() {
		//onkeyup sometimes gets triggered too late -> so mark expanded TOC nodes on focus
		var filter = document.getElementById("filterTOC");
		var val = filter.value;
		if (val.length == 0)
		{
			var alreadyThereElements = $('.aras-nav-toc').find('span').parents('.aras-nav__parent_expanded');
			alreadyThereElements.addClass('hadbefore_aras-nav__parent_expanded');
		}
	}

	_filterTOC() {
		// Get the value to filter by
		var filter = document.getElementById("filterTOC");
		var val = filter.value;
		
		if (event.keyCode == 13 && val != null && val.length > 0)
		{
			$('.aras-nav-toc').find('ul').first().find('li:visible:not(.aras-nav__parent)').first().trigger('click')
		}
		
		if ((val == null) || (val == ""))
		{
			this.showAllTOCNodes();
			return;
		}
		
		this.hideAllTOCNodes();
		this.showParentsUntilRootTOC(val);
	}

	// End TOC Searchbar Modifications

	created() {
		this._initTOC();
		this._initTabs();
	}

	resetState() {
		this.state.secondaryMenuData = null;
		this.render();
	}

	_initContextMenuHandlers() {
		const sidebarTabs = this.tabs;
		const contextMenuMethods = {
			pinItemType: (id, tabData) => sidebarTabs.addTab(id, tabData),
			unpinItemType: (id) => {
				const tabsData = sidebarTabs.data;
				const removedTab = tabsData.get(id);
				sidebarTabs.removeTab(id);
				return removedTab;
			},
			getItemTypeByItemTypeId: (itemTypeId) => {
				let tabId;
				const tabsData = sidebarTabs.data;
				tabsData.forEach((data, id) => {
					if (data.itemTypeId === itemTypeId) {
						tabId = id;
					}
				});
				return tabsData.get(tabId);
			},
			openSearch: (...args) => window.arasTabs.openSearch(...args)
		};
		const dispatchContextMenuEvent = (controlName, event, options) => {
			event.preventDefault();
			const detail = {
				controlName,
				x: event.clientX,
				y: event.clientY,
				...options
			};
			const cuiEvent = new CustomEvent('navigationPanelContextMenu', {
				detail
			});
			this.dispatchEvent(cuiEvent);
		};
		sidebarTabs.on('contextmenu', (itemKey, event) => {
			const currentTarget = sidebarTabs.data.get(itemKey);
			const itemTypeName = currentTarget.contextType;
			const options = {
				currentTarget,
				itemTypeName,
				...contextMenuMethods
			};
			dispatchContextMenuEvent('MainView.PopupMenu', event, options);
		});
		const nav = this.nav;
		nav.on('contextmenu', (itemKey, event) => {
			nav.select(itemKey);
			const currentTarget = nav.data.get(itemKey);
			const itemTypeId = currentTarget.itemTypeId;
			const options = {
				currentTarget,
				itemTypeId,
				...contextMenuMethods
			};
			dispatchContextMenuEvent('MainView.PopupMenu', event, options);
		});
		this._favoritesContextMenuHandler = (event) => {
			const favoriteItemRow = event.target.closest('.aras-nav__child');
			if (!favoriteItemRow) {
				return;
			}

			favoriteItemRow.classList.add('aras-nav__child_selected');
			const unselectHighlightedItem = () => {
				favoriteItemRow.classList.remove('aras-nav__child_selected');
				this.popupMenu.dom.removeEventListener(
					'contextMenuClose',
					unselectHighlightedItem
				);
			};
			this.popupMenu.dom.addEventListener(
				'contextMenuClose',
				unselectHighlightedItem
			);

			const favoriteId = favoriteItemRow.dataset.key;
			const currentTarget = this.state.favorites[favoriteId];
			const itemTypeName = currentTarget.contextType;
			const options = {
				currentTarget,
				itemTypeName
			};
			dispatchContextMenuEvent(
				'MainView.PopupMenuSecondaryMenu',
				event,
				options
			);
		};
	}

	_initContextMenuListeners() {
		const contextMenuDom = this.popupMenu.dom;
		contextMenuDom.addEventListener('contextMenuShow', () => {
			this.classList.remove(disabledRowHighlightingClass);
		});
		contextMenuDom.addEventListener('contextMenuClose', (e) => {
			this.classList.add(disabledRowHighlightingClass);
			if (e.detail.type === 'keydown') {
				this.focus();
				return;
			}

			if (!this.isPinned) {
				setTimeout(() => {
					this.closeIfNotAcitive(document.activeElement);
				});
			}
		});
		contextMenuDom.addEventListener('click', () => {
			this._hideIfNotPinned();
		});
	}

	closeIfNotAcitive(element) {
		const isElement = Boolean(element && this.contains(element));
		const isContextMenu = Boolean(
			element &&
				(this.popupMenu.dom.contains(element) ||
					this.secondaryPopupMenu.dom.contains(element))
		);
		if (!(isElement || isContextMenu)) {
			this.toggleVisibility(false);
		}
	}

	_initTOC() {
		const selectTab = (dataItem) => {
			const tabs = this.tabs;
			tabs.data.forEach((tabItem, id) => {
				if (tabItem.itemTypeId === dataItem.itemTypeId) {
					tabs.selectTab(id);
				}
			});
		};
		this.nav.classList.add('aras-nav-toc');
		this.nav.formatter = navFormatter.bind(null, this.nav);
		const handler = async (itemKey, event) => {
			if (
				event.type === 'keydown' &&
				!['Enter', 'Space', 'NumpadEnter'].includes(event.code)
			) {
				return;
			}
			const dataItem = this.nav.data.get(itemKey);
			const isNewTabOpened =
				dataItem.dashboard ||
				event.target.closest('.aras-button.aras-nav-leaf-ico');
			if (isNewTabOpened) {
				this._hideIfNotPinned();
			} else if (dataItem.itemTypeId) {
				this._showSecondaryMenu(dataItem.itemTypeId);
				selectTab(dataItem);
			}
		};
		this.nav.on('click', handler);
		this.nav.on('keydown', handler);
	}

	_initTabs() {
		this.tabs.on('select', (id) => {
			if (this.staticTabs.includes(id)) {
				this._hideSecondaryMenu(id);
				return;
			}

			const item = this.tabs.data.get(id);
			this._showSecondaryMenu(item.itemTypeId);
		});

		this.tabs.on('click', (id) => {
			if (this.staticTabs.includes(id)) {
				this._hideSecondaryMenu(id);
			}
		});
	}

	_hideIfNotPinned() {
		if (!this.isPinned) {
			this.toggleVisibility(false);
			document.documentElement.focus(); // for correct work of sidebar in IE and FF
		}
	}

	_getSecondaryMenuData() {
		const itemTypeId = this.state.secondaryMenuItemTypeId;
		if (!itemTypeId) {
			return null;
		}

		const items = [...this.nav.data.values()];
		const item = items.find(
			(item) => item.itemTypeId === itemTypeId && !item.dashboard
		);
		if (!item) {
			this._hideSecondaryMenu();
			return null;
		}

		const { icon = icons.defaultItemType, label: pluralLabel } = item;
		const itemTypeName = itemTypeMetadata.getItemTypeName(itemTypeId);
		const favoriteCategories = getFavoriteCategories(itemTypeName, {
			icon,
			pluralLabel,
			favorites: this.state.favorites
		});

		if (this.state.secondaryMenuData?.itemTypeId === itemTypeId) {
			return {
				...this.state.secondaryMenuData,
				favoriteCategories
			};
		}

		const loggedUserIdentity = aras.getIsAliasIdentityIDForLoggedUser();
		const secondaryMenuData = {
			canAdd: false,
			favoriteCategories,
			icon,
			itemTypeId,
			itemTypeName,
			isQuickSearchDisabled: true,
			loggedUserIdentity,
			pluralLabel,
			singularLabel: itemTypeName
		};

		this._updateSecondaryMenuData(itemTypeId);

		return secondaryMenuData;
	}

	_showSecondaryMenu(itemTypeId) {
		this.currentTab = 'secondary-tab';
		this.state.secondaryMenuItemTypeId = itemTypeId;
		this.topScroll = this.nav.scrollTop;

		super.focus();
		this.render();
		this.focus();
	}

	_hideSecondaryMenu(tabId = contentTabId) {
		this.currentTab = tabId;
		this.state.secondaryMenuItemTypeId = null;
		this.tabs.selectTab(tabId);

		super.focus();
		this.render();
		this.nav.focus();
	}

	async _updateSecondaryMenuData(itemTypeId) {
		const itemTypeData = await getItemTypeData(itemTypeId);
		if (this.state.secondaryMenuItemTypeId !== itemTypeId) {
			return;
		}

		this.state.secondaryMenuData = {
			...this.state.secondaryMenuData,
			...itemTypeData
		};
		this.render();
		this.focus();
	}

	async _favoritesClick(event) {
		const favoriteItemRow = event.target.closest('.aras-nav__child');
		if (!favoriteItemRow) {
			return;
		}

		const favoriteId = favoriteItemRow.dataset.key;
		const favoriteItem = this.state.favorites[favoriteId];
		const unpinIconNode = event.target.closest(
			'.aras-button.aras-nav-leaf-ico'
		);
		if (unpinIconNode) {
			favoriteMethods.removeFromQuickAccess(favoriteId);
		} else if (favoriteItem.category === 'Item') {
			const favoriteItemType = favoriteItem.contextType;
			const itemType = await itemTypeMetadata.getItemType(favoriteItemType);
			const isVersionable = itemType['is_versionable'] === '1';
			const getItemMethod = isVersionable
				? 'getItemLastVersion'
				: 'getItemById';
			const itemNode = aras[getItemMethod](
				favoriteItemType,
				favoriteItem.additional_data.id,
				isVersionable ? false : 0
			);
			const openCommand = createCommand('OpenItem', itemType, { itemNode });
			if (openCommand.canExecute()) {
				await openCommand.execute();

				return this._hideIfNotPinned();
			}

			const errorMessage = getResource(
				'ui_methods.access_restricted_or_not_exist',
				favoriteItemType
			);
			alertModule(errorMessage, {
				type: 'error'
			});
		} else if (favoriteItem.category === 'Search') {
			let itemTypeId = this.state.secondaryMenuItemTypeId;
			if (!itemTypeId) {
				const itemTypeName = favoriteItem.contextType;
				itemTypeId = itemTypeMetadata.getItemTypeId(itemTypeName);
			}
			this._searchItemType(itemTypeId, favoriteId);
		}
	}

	async _createNewItem() {
		const { itemType } = this.state.secondaryMenuData;
		const openNewItemCommand = createCommand('OpenNewItem', itemType);

		await openNewItemCommand.execute();

		this._hideIfNotPinned();
	}

	_searchItemType(itemTypeId, favoriteSearchId) {
		return Promise.resolve(
			window.arasTabs.openSearch(itemTypeId, favoriteSearchId)
		).then(() => {
			this._hideIfNotPinned();
		});
	}

	async _openItem(event) {
		const quickSearch = event.currentTarget;
		const selectedItem = quickSearch.getSelectedItem();
		if (!selectedItem) {
			return;
		}
		quickSearch.clear();

		const { itemType } = this.state.secondaryMenuData;
		const itemNode = aras.getItemById(itemType.name, selectedItem.itemId);
		const openCommand = createCommand('OpenItem', itemType, { itemNode });
		if (openCommand.canExecute()) {
			openCommand.execute();
		}
	}
}

NavigationPanel.define('aras-navigation-panel');
