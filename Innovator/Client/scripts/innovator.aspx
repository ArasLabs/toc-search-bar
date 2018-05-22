<%@ Page CodePage=65001 Language="VB" Explicit="True" Strict="true" %>
<%
	Dim ICC As Aras.Client.Core.ClientConfig = Aras.Client.Core.ClientConfig.GetServerConfig()
%>
<!DOCTYPE HTML>
<html>
	<head>
		<title></title>
		<link rel="stylesheet" href="../styles/common.min.css"/>
		<link rel="stylesheet" href="../styles/main.min.css"/>
		<link rel="stylesheet" href="../javascript/include.aspx?classes=arasClaro.css">
		<link rel="stylesheet" href="../javascript/include.aspx?classes=common.css,spinner.css">
		<style>
			body {
				overflow: hidden;
			}
			/* disable default outline for focused element in Chrome */
			@supports (-webkit-appearance:none) {
				*:focus {
					outline: none
				}
			}
			.spinner, .main {
				position: absolute;
				width: 100%;
				height: 100%;
			}
			#banner{
				height: <%=ICC.BannerHeight.ToString()%>px;
			}
			
			/* Start Filter TOC Modifications */
			.filterContainer {
				margin: 0 2px 5px 15px;
				position: relative;
				max-width: 150px;
				width: 90%;
			}
			#filterTOC {
				padding-right: 20px;
				box-sizing: border-box;
				width: 100%;
			}
			#filterTOC:hover {
				background-color: #dde7f5;
			}
			#clearFilterButton {
				max-height: 16px;
				max-width: 16px;
				position: absolute;
				right: 0%;
				top: 0px;
				border: none;
			}
			/* End Filter TOC Modifications */

		</style>
		<!-- #INCLUDE FILE="include/InitialSetupHeader.aspx" -->
		<script src="./external/jquery-3.2.1.min.js"></script>
		<script type="text/javascript">
		//Require 'Aras/Client/Controls/Experimental/TimeZoneInfo' need for pre-caching for TimeZonesInformation.js
		require(
			[
				'dojo/date/locale',
				'Aras/Client/Controls/Experimental/MainMenu',
				'Aras/Client/Controls/Experimental/StatusBar',
				'Aras/Client/Frames/StatusBar',
				'Aras/Client/Controls/Experimental/TimeZoneInfo'
			]
		);

		onbeforeunload = function() {
			if (aras.isDirtyItems()) {
				window.onLogoutCommand();
				var rm = new ResourceManager(new Solution('core'), 'ui_resources.xml', aras.getSessionContextLanguageCode());
				return rm.getString('setup.beforeunload_warning');
			} else if(window.arasTabs && !document.getElementById('home-tab').classList.contains('aras-tabs_active')) {
				var rm = new ResourceManager(new Solution('core'), 'ui_resources.xml', aras.getSessionContextLanguageCode());
				return rm.getString('setup.tab_close_warning');
			}

			stopTimeBannersUpdate();
			
			//Onunload handler does not start in Chrome when the opener are closed.
			//As a result, save preference and logout not called.
			if (aras.Browser.isCh() && !window.opener) {
				aras.getOpenedWindowsCount(true);
				aras.logout();
			}
		};
		
		// Start Filter TOC Modifications
		
		// override the jquery 'contains' filter to be case insensitive
		jQuery.expr[':'].contains = function(a, i, m) {
		  return jQuery(a).text().toUpperCase().indexOf(m[3].toUpperCase()) >= 0;
		};
		
		function showAllTOCNodes() {
			$('.aras-nav').each(function() {
				$(this).find('*').show();
				
				var item = document.item;
				var thisItem = document.thisItem;
			})
			
			var elements = $('.aras-nav-toc').find("span").parents('.aras-nav-parent_expanded').not('.hadbefore_aras-nav-parent_expanded');
			elements.removeClass('aras-nav-parent_expanded');
		}
		
		function hideAllTOCNodes() {
			$('.aras-nav').each(function() {
				$(this).find('*').hide();
			});
		}
		
		function showParentsUntilRootTOC(val) {
			$('.aras-nav-toc').find("span:contains('" + val + "')").show();
			$('.aras-nav-toc').find("span:contains('" + val + "')").parentsUntil(".aras-nav").show();
			$('.aras-nav-toc').find("span:contains('" + val + "')").parentsUntil(".aras-nav").children('div,svg,img').show();
			$('.aras-nav-toc').find("span:contains('" + val + "')").parentsUntil(".aras-nav").children('div,svg,img').find('*').show();
			$('.aras-nav-toc').find("span:contains('" + val + "')").parents('.aras-nav-parent').addClass('aras-nav-parent_expanded');
		}
		
		function clearFilter() {
			var tValue = $('#filterTOC').val();
			
			if (tValue != null && tValue != '')
			{
				$('#filterTOC').val('');
				showAllTOCNodes();
			}	
			
			//filter is already cleared -> mark expanded TOC nodes
			if (tValue.length == 0)
			{	
				var alreadyThereElements = $('.aras-nav-toc').find('span').parents('.aras-nav-parent_expanded');
				alreadyThereElements.addClass('hadbefore_aras-nav-parent_expanded');
			}
		}
		
		function onFilterFocus() {
		    //onkeyup sometimes gets triggered too late -> so mark expanded TOC nodes on focus
			var filter = document.getElementById("filterTOC");
			var val = filter.value;
			if (val.length == 0)
			{
				var alreadyThereElements = $('.aras-nav-toc').find('span').parents('.aras-nav-parent_expanded');
				alreadyThereElements.addClass('hadbefore_aras-nav-parent_expanded');
			}
		}
		
		function onkeyupfilter(event) {
			// Get the value to filter by
			var filter = document.getElementById("filterTOC");
			var val = filter.value;
			
			if (event.keyCode == 13 && val != null && val.length > 0)
			{
				$('.aras-nav-toc').find('ul').first().find('li:visible:not(.aras-nav-parent)').first().trigger('click')
			}
			
			if ((val == null) || (val == ""))
			{
				showAllTOCNodes();
				return;
			}
			
			// Get the TOC container
			var toc = document.getElementsByClassName("aras-nav-toc");
			if (!toc || toc.length < 1)
			{
				return;
			}
			toc = toc[0];
			
			var tocElems = toc.getElementsByTagName("span");
			var elemsToShow = [];
			
			hideAllTOCNodes();
			showParentsUntilRootTOC(val);
		}
		
		// End Filter TOC Modifications
		</script>
	</head>
	<body class="claro">
		<iframe id="tz" class="main" name="tz" frameborder="0"  style="z-index: 3" src="timeZoneDetect.html"></iframe>
		<iframe id="deepLinking" class="main" name="deepLinking" frameborder="0"  style="z-index: 2; display: none;"></iframe>
		<iframe id="main" class="main" name="main" frameborder="0" style="z-index: 1" src="login.aspx<%=System.Web.Security.AntiXss.AntiXssEncoder.HtmlEncode(qs,false)%>" ></iframe>
		<header id="header">
			<%If Not ICC.BannerUrl Is Nothing OrElse String.IsNullOrEmpty(ICC.BannerUrl.OriginalString) Then
				Response.Write("<iframe id=""banner"" style=""display: none"" src=""" + ICC.BannerUrl.OriginalString + """ scrolling=""no"" noresize=""noresize""  frameborder=""0"" framespacing=""0"" ></iframe>")
			End If%>
			<img class="header-logo" src="<%=Client_Config("branding_img")%>" alt=""/>

			<div class="profile">
				<img class="profile-img" id="profileImg" src="../images/DefaultAvatar.svg" alt="" />
				<p class="profile-name" id="profileName"></p>
				<p class="profile-logout"><a id="profileLogout" href="#">Logout</a></p>
			</div>

			<div class="time-wrap">
				<div id="today_corp_block" class="time-block" style="visibility:hidden;">
					<span id="today_corp_time" class="current-time"></span>
					<div id="today_corp_text" class="text">
						<h4><span aras_ui_resource_key="common.corporateTime"></span></h4>
						<span id="today_corp_date" class="date"></span>
					</div>
				</div>
				<div id="today_block" class="time-block">
					<span id="today_time" class="current-time"></span>
					<div id="today_text" class="text">
						<h4><span aras_ui_resource_key="common.localTime"></span></h4>
						<span id="today_date" class="date"></span>
					</div>
				</div>
			</div>
			<div id="main-tab" class="main-tabs aras-flex">
				<div class="aras-tabs">
					<ul>
						<li id="home-tab" class="aras-tabs_active"><span class="aras-icon-hamburger"></span></li>
					</ul>
				</div>
				<div class="aras-tabs aras-flex-grow">
					<span class="aras-tabs-arrow"></span>
					<div>
						<ul></ul>
					</div>
					<span class="aras-tabs-arrow"></span>
				</div>
				<div id="tabs-dropdown" class="aras-dropdown-container">
					<div class="tabs-button"></div>
					<div class="aras-dropdown">
					</div>
				</div>
			</div>
			<div class="menu-block" id="menulayout"></div>
			<div align="right" ><span id="today_lbl_corp" style="display: none;" aras_ui_resource_key="banner.corporate_time_html"></span></div>
			<div align="left" ><span id="today_lbl" style="display: none;" aras_ui_resource_key="banner.local_time_html"></span></div>
		</header>
		<main id="main-container">
			<div id="togglePanel" class="aras-toggle-panel aras-hide" onclick="hideOrShowTree()">
				<div class="aras-toggle-panel__toggler" title="Show Contents">
					<span class="aras-icon-arrow"></span>
				</div>
			</div>
			<div id="leading" class="aras-toggle-panel">
				<div class="aras-toggle-panel__header">
					<span aras_ui_resource_key="common.contents"></span>
					<div class="aras-toggle-panel__toggler" title="Hide" onclick="hideOrShowTree()">
						<span class="aras-icon-arrow aras-icon-arrow_left"></span>
					</div>
				</div>
				<!-- Start Filter TOC Modifications -->
				<div class="filterContainer">
					<input type="text" id="filterTOC" onkeyup="onkeyupfilter(event)" onfocus="onFilterFocus()" placeholder="Filter..." />
					<input type="image" src="..\images\Delete.svg" id="clearFilterButton" onclick="clearFilter()" />
				</div>
				<!-- End Filter TOC Modifications -->
				<div class="aras-nav-toc"></div>
			</div>
			<div class="aras-splitter" id="main-container-splitter"></div>
			<div id="center" class="aras-flex-grow">
				<iframe id="dimmer_spinner" class="disabled-spinner" src="../scripts/Spinner.html"></iframe>
				<iframe id="work" src="../scripts/blank.html" scrolling="auto" frameborder="0" style="width: 100%;height: 100%; margin-top: 1px;"></iframe>
			</div>
		</main>
		<footer id="bottom"></footer>
		<iframe id="tree" src="../scripts/mainTree.html" scrolling="no" style="display: none"></iframe>
		<iframe id="dimmer_spinner_whole_window" src="../scripts/Spinner.html"></iframe>
		<svg id='svg-symbols' style="display:none"></svg>
	</body>
</html>
