<main id="whiteboard-main" class="s-theme--dark u-position--absolute-stretch" data-theme="auto">
	<!-- Dashboard -->
	<section id="whiteboard-dashboard" class="o-dashboard u-box-sizing--border-box u-display--grid u-padding--3 u-position--absolute-stretch">
		<!-- Dashboard / Whiteboard -->
		<div id="whiteboard-canvas" class="o-canvas o-canvas--hidden u-position--absolute-center">
			<canvas id="whiteboard-grid-canvas" class="c-canvas" width="0" height="0"></canvas>
			<canvas id="whiteboard-main-canvas" class="c-canvas u-position--absolute-stretch" width="0" height="0"></canvas>
			<div id="whiteboard-control" class="o-control u-position--absolute-stretch"></div>
		</div>
		<!-- Dashboard / Top -->
		<section class="o-dashboard-top u-display--grid">
			<!-- Dashboard / Top / Left -->
			<section class="o-dashboard-top-left u-align-items--center u-display--inline-grid u-grid-auto-flow--column u-justify-content--center u-padding--3">
				<div class="o-shelf o-shelf--horizontally u-display--grid u-grid-auto-flow--column u-position--relative u-shape-pill--48 u-z-index--2">
					<button class="o-shelf-item o-shelf-first-item o-shelf-last-item c-button c-button--transparent u-font-size--24 u-font-family--material-icons u-position--relative u-shape-pill--48">
						<div>place</div>
						<select id="whiteboard-places" class="u-cursor--pointer u-font-size--12 u-opacity--0 u-position--absolute-stretch" title="<?php echo $Translator->getString('{*places.title}'); ?>">
							<optgroup label="<?php echo $Translator->getString('{*places.group.default.title}'); ?>">
								<option value="0;0"><?php echo $Translator->getString('{*places.group.default.option.whiteboard_center}'); ?></option>
							</optgroup>
						</select>
					</button>
				</div>
				<div class="o-shelf o-shelf--horizontally u-display--grid u-grid-auto-flow--column u-margin-left--6 u-position--relative u-shape-pill--48 u-z-index--2 s-mobile-portrait--hidden">
					<div id="whiteboard-title" class="o-shelf-item-text o-shelf-first-item-text o-shelf-last-item-text u-line-height--48 u-overflow--hidden u-text-overflow--ellipsis u-white-space--nowrap"></div>
				</div>
			</section>
			<!-- Dashboard / Top / Center -->
			<section class="o-dashboard-top-center u-align-items--center u-display--inline-grid u-grid-auto-flow--column u-justify-content--right u-padding--3">
				<div class="o-shelf o-shelf--horizontally u-display--grid u-grid-auto-flow--column u-position--relative u-shape-pill--48 u-z-index--2">
					<button id="whiteboard-language-button" class="o-shelf-item o-shelf-first-item o-shelf-last-item c-button c-button--transparent u-font-size--12 u-position--relative u-shape-pill--48 u-text-transform--uppercase">
						<div><?php echo $Translator->getLanguage(); ?></div>
						<select id="whiteboard-language-select" class="u-cursor--pointer u-font-size--12 u-opacity--0 u-position--absolute-stretch" title="<?php echo $Translator->getString('{language}'); ?>">
							<optgroup label="<?php echo $Translator->getString('{language}'); ?>">
								<?php
								foreach($Translator->getLanguages() as $k => $v) {
									echo '<option value="'.$k.'">'.$Translator->getString('{*language.'.$k.'}', $k).($k == $Translator->getBrowserLanguage() ? $Translator->getString(' ({default})') : '').'</option>';
								}
								?>
							</optgroup>
						</select>
					</button>
				</div>
				<div class="o-shelf o-shelf--horizontally u-display--grid u-grid-auto-flow--column u-margin-left--6 u-position--relative u-shape-pill--48 u-z-index--2">
					<button class="o-shelf-item o-shelf-first-item c-button c-button--transparent u-font-size--24 u-font-family--material-icons u-position--relative u-shape-pill--48">
						<div>save</div>
						<select id="whiteboard-export" class="u-cursor--pointer u-font-size--12 u-opacity--0 u-position--absolute-stretch" title="<?php echo $Translator->getString('{*export.title}'); ?>">
							<optgroup label="<?php echo $Translator->getString('{*export.group.source.title}'); ?>">
								<option value="json"><?php echo $Translator->getString('{*export.group.source.option.json}'); ?></option>
							</optgroup>
							<optgroup label="<?php echo $Translator->getString('{*export.group.image.title}'); ?>">
								<option value="bmp"><?php echo $Translator->getString('{*export.group.image.option.bmp}'); ?></option>
								<option value="jpg"><?php echo $Translator->getString('{*export.group.image.option.jpg}'); ?></option>
								<option value="png"><?php echo $Translator->getString('{*export.group.image.option.png}'); ?></option>
							</optgroup>
						</select>
					</button>
					<button class="o-shelf-item o-shelf-last-item c-button c-button--transparent u-font-size--24 u-font-family--material-icons u-position--relative u-shape-pill--48">
						<div>share</div>
						<select id="whiteboard-share" class="u-cursor--pointer u-font-size--12 u-opacity--0 u-position--absolute-stretch" title="<?php echo $Translator->getString('{share}'); ?>" data-copy-text="<?php echo $Translator->getString('{share_copy_success}'); ?>" data-email-text="<?php echo $Translator->getString('{share_enter_email}'); ?>" data-email-subject="<?php echo $Translator->getString('{share_email_subject}'); ?>" data-email-body="<?php echo $Translator->getString('{share_email_body}'); ?>">
							<option value="copy"><?php echo $Translator->getString('{share_copy_link}'); ?></option>
							<optgroup label="<?php echo $Translator->getString('{share}'); ?>">
								<option value="email"><?php echo $Translator->getString('{share_email}'); ?></option>
								<option value="email_manually"><?php echo $Translator->getString('{share_email} ({manually})'); ?></option>
							</optgroup>
						</select>
					</button>
				</div>
			</section>
			<!-- Dashboard / Top / Right -->
			<section class="o-dashboard-top-right u-align-items--center u-display--inline-grid u-grid-auto-flow--column u-justify-content--center u-padding--3">
				<div class="o-shelf o-shelf--horizontally u-display--grid u-grid-auto-flow--column u-position--relative u-shape-pill--48 u-z-index--2">
					<button id="whiteboard-user-button" class="o-user-button o-shelf-item o-shelf-first-item o-shelf-last-item c-button c-button--transparent u-font-size--24 u-font-family--material-icons u-position--relative u-shape-pill--48">
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
		<!-- Dashboard / Bottom -->
		<section class="o-dashboard-bottom u-display--grid">
			<!-- Dashboard / Bottom / Right -->
			<section class="o-dashboard-bottom-right u-align-items--bottom u-display--inline-grid u-grid-auto-flow--row u-justify-content--right u-padding--3">
				<div class="o-shelf o-shelf--vertically u-display--grid u-grid-auto-flow--row u-justify-content--center u-position--relative u-shape-pill--48 u-z-index--2">
					<button id="whiteboard-grid" class="o-shelf-item o-shelf-first-item o-shelf-last-item c-button c-button--transparent u-font-size--24 u-font-family--material-icons u-shape-pill--48" title="<?php echo $Translator->getString('{grid_off} (g)'); ?>" data-grid-full-title="<?php echo $Translator->getString('{grid_full} (g)'); ?>" data-grid-full-html="grid_on" data-grid-off-title="<?php echo $Translator->getString('{grid_off} (g)'); ?>" data-grid-off-html="grid_off" data-grid-half-title="<?php echo $Translator->getString('{grid_half} (g)'); ?>" data-grid-half-html="window" onclick="toggleGrid();">grid_off</button>
				</div>
				<div class="o-shelf o-shelf--vertically u-display--grid u-grid-auto-flow--row u-justify-content--center u-margin-top--6 u-position--relative u-shape-pill--48 u-z-index--2">
					<button id="whiteboard-theme" class="o-shelf-item o-shelf-first-item o-shelf-last-item c-button c-button--transparent u-font-size--24 u-font-family--material-icons u-shape-circle--48" title="<?php echo $Translator->getString('{theme_dark} (t)'); ?>" data-theme-auto-title="<?php echo $Translator->getString('{theme_auto} (t)'); ?>" data-theme-auto-html="brightness_auto" data-theme-dark-title="<?php echo $Translator->getString('{theme_dark} (t)'); ?>" data-theme-dark-html="nights_stay" data-theme-light-title="<?php echo $Translator->getString('{theme_light} (t)'); ?>" data-theme-light-html="wb_sunny" onclick="whiteboard.toggleTheme();">nights_stay</button>
				</div>
				<div class="o-shelf o-shelf--vertically u-display--grid u-grid-auto-flow--row u-justify-content--center u-margin-top--6 u-position--relative u-shape-pill--48 u-z-index--2 s-mobile-landscape--hidden">
					<button id="whiteboard-zoom-in" class="o-shelf-item o-shelf-first-item c-button c-button--transparent u-font-size--24 u-font-family--material-icons u-shape-pill--48" title="<?php echo $Translator->getString('{zoom_in} (+)'); ?>">add</button>
					<button id="whiteboard-zoom-restore" class="o-shelf-item-text c-button c-button--transparent u-line-height--24" title="<?php echo $Translator->getString('{zoom_restore}'); ?>">100%</button>
					<button id="whiteboard-zoom-out" class="o-shelf-item o-shelf-last-item c-button c-button--transparent u-font-size--24 u-font-family--material-icons u-shape-pill--48" title="<?php echo $Translator->getString('{zoom_out} (-)'); ?>">remove</button>
				</div>
				<div class="o-shelf o-shelf--vertically u-display--grid u-grid-auto-flow--row u-justify-content--center u-margin-top--6 u-position--relative u-shape-pill--48 u-z-index--2">
					<button id="whiteboard-fullscreen" class="o-shelf-item o-shelf-first-item o-shelf-last-item c-button c-button--transparent u-font-size--24 u-font-family--material-icons u-shape-pill--48" title="<?php echo $Translator->getString('{fullscreen} (f)'); ?>" onclick="whiteboard.toggleFullscreen(this, '<?php echo $Translator->getString('{fullscreen} (f)'); ?>', 'fullscreen', '<?php echo $Translator->getString('{fullscreen_exit} (f)'); ?>', 'fullscreen_exit');">fullscreen</button>
				</div>
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