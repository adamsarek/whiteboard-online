<main id="whiteboard-main" class="s-theme--dark u-position--absolute-stretch" data-theme="auto">
	<!-- Dashboard -->
	<section id="whiteboard-dashboard" class="o-dashboard u-box-sizing--border-box u-display--grid u-padding--3 u-position--absolute-stretch">
		<!-- Dashboard / Top -->
		<section class="o-dashboard-top u-display--grid">
			<!-- Dashboard / Top / Left -->
			<section class="o-dashboard-top-left u-align-items--center u-display--inline-grid u-grid-auto-flow--column u-justify-content--center u-padding--3">
				<div class="o-shelf o-shelf--horizontally u-display--grid u-grid-auto-flow--column u-position--relative u-shape-pill--48 u-z-index--1">
					<div id="whiteboard-title" class="o-shelf-item-text o-shelf-first-item-text o-shelf-last-item-text u-line-height--48 u-overflow--hidden u-text-overflow--ellipsis u-white-space--nowrap"><?php echo $Translator->getString('{*web.title}'); ?></div>
				</div>
			</section>
			<!-- Dashboard / Top / Center -->
			<section class="o-dashboard-top-center u-align-items--center u-display--inline-grid u-grid-auto-flow--column u-justify-content--right u-padding--3">
				<div class="o-shelf o-shelf--horizontally u-display--grid u-grid-auto-flow--column u-position--relative u-shape-pill--48 u-z-index--1">
					<button id="whiteboard-language-button" class="o-shelf-item o-shelf-first-item o-shelf-last-item c-button c-button--transparent u-font-size--12 u-position--relative u-shape-circle--48 u-text-transform--uppercase">
						<div><?php echo $Translator->getLanguage(); ?></div>
						<select id="whiteboard-language-select" class="u-cursor--pointer u-font-size--12 u-opacity--0 u-position--absolute-stretch" title="<?php echo $Translator->getString('{language}'); ?>">
							<optgroup label="<?php echo $Translator->getString('{language}'); ?>">
								<?php
								foreach($Translator->getLanguages() as $k => $v) {
									if($k == $Translator->getBrowserLanguage()) {

									}
									echo '<option value="'.$k.'">'.$Translator->getString('{*language.'.$k.'}', $k).($k == $Translator->getBrowserLanguage() ? $Translator->getString(' ({default})') : '').'</option>';
								}
								?>
							</optgroup>
						</select>
					</button>
				</div>
				<div class="o-shelf o-shelf--horizontally u-display--grid u-grid-auto-flow--column u-margin-left--6 u-position--relative u-shape-pill--48 u-z-index--1">
					<button id="whiteboard-theme" class="o-shelf-item o-shelf-first-item o-shelf-last-item c-button c-button--transparent u-font-size--24 u-font-family--material-icons u-shape-circle--48" title="<?php echo $Translator->getString('{theme_dark} (t)'); ?>" data-theme-auto-title="<?php echo $Translator->getString('{theme_auto} (t)'); ?>" data-theme-auto-html="brightness_auto" data-theme-dark-title="<?php echo $Translator->getString('{theme_dark} (t)'); ?>" data-theme-dark-html="nights_stay" data-theme-light-title="<?php echo $Translator->getString('{theme_light} (t)'); ?>" data-theme-light-html="wb_sunny" onclick="toggleTheme();">nights_stay</button>
				</div>
			</section>
			<!-- Dashboard / Top / Right -->
			<section class="o-dashboard-top-right u-align-items--center u-display--inline-grid u-grid-auto-flow--column u-justify-content--center u-padding--3">
				<div class="o-shelf o-shelf--horizontally u-display--grid u-grid-auto-flow--column u-position--relative u-shape-pill--48 u-z-index--1">
					<button id="whiteboard-user-button" class="o-user-button o-shelf-item o-shelf-first-item o-shelf-last-item c-button c-button--transparent u-font-size--24 u-font-family--material-icons u-position--relative u-shape-circle--48">
						<img id="whiteboard-user-image" class="o-user-image">
						<select id="whiteboard-user-select" class="u-cursor--pointer u-font-size--12 u-opacity--0 u-position--absolute-stretch">
							<optgroup>
								<option value="user-account"><?php echo $Translator->getString('{user_account}'); ?></option>
								<option value="sign-out"><?php echo $Translator->getString('{sign_out}'); ?></option>
							</optgroup>
						</select>
					</button>
				</div>
			</section>
		</section>
		<!-- Dashboard / Middle -->
		<section class="o-dashboard-middle u-display--grid u-overflow--hidden u-padding--3">
			<!-- Dashboard / Middle / Center -->
			<section class="o-dashboard-middle-center u-align-items--center u-display--inline-grid u-grid-auto-flow--row u-max-height--100p u-justify-content--stretch u-overflow--auto">
				<div class="o-title u-font-size--24 u-margin-vertically--12 u-padding-bottom--6">
					<div><?php echo $Translator->getString('{my_whiteboards}'); ?></div>
					<button id="whiteboard-user-add-button" class="o-title-button c-button c-button--color u-font-size--24 u-font-family--material-icons u-line-height--48 u-shape-pill--48" title="<?php echo $Translator->getString('{add_whiteboard}'); ?>" data-add-title="<?php echo $Translator->getString('{whiteboard_name}'); ?>">add</button>
				</div>
				<div id="whiteboard-user-grid" class="o-user-grid u-align-items--center u-display--grid u-grid-auto-flow--row u-grid-gap--6 u-justify-content--stretch" data-title-placeholder="<?php echo $Translator->getString('{title_placeholder}'); ?>" data-edit-title="<?php echo $Translator->getString('{open_in_edit_mode}'); ?>" data-view-title="<?php echo $Translator->getString('{open_in_view_mode}'); ?>" data-delete-title="<?php echo $Translator->getString('{delete_whiteboard}'); ?>" data-empty-text="<?php echo $Translator->getString('{whiteboards_empty}'); ?>"></div>
			</section>
		</section>
	</section>
	<!-- Overlay -->
	<section id="whiteboard-overlay" class="o-overlay u-position--absolute-stretch">
		<!-- Overlay / Login -->
		<div id="whiteboard-login" class="o-login o-login--hidden o-shelf o-shelf--vertically u-display--grid u-grid-auto-flow--row u-position--absolute-center u-shape-pill--48">
			<div class="o-shelf-item-text u-font-size--18 u-line-height--32 u-margin--6 u-overflow--hidden u-text-overflow--ellipsis u-white-space--nowrap"><?php echo $Translator->getString('{sign_in}'); ?></div>
			<div id="whiteboard-google-login" class="g-signin2 o-shelf-item-text c-button u-border-radius--12 u-line-height--48 u-margin--6 u-overflow--hidden u-text-overflow--ellipsis u-white-space--nowrap" data-height="48" data-longtitle="true" data-theme="dark" data-onsuccess="onSignIn"></div>
		</div>
		<!-- Overlay / Loading -->
		<div class="o-shelf u-display--grid u-position--absolute-center u-shape-pill--48">
			<div class="o-shelf-item u-line-height--48 u-overflow--hidden u-text-overflow--ellipsis u-white-space--nowrap">
				<noscript class="u-padding-horizontally--12"><?php echo $Translator->getString('{noscript}'); ?></noscript>
				<div id="whiteboard-loading" class="c-loading c-loading--hidden"></div>
			</div>
		</div>
	</section>
</main>