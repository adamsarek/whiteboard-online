<main id="whiteboard-main" class="s-theme--dark u-position--absolute-stretch" data-theme="auto">
	<!-- Dashboard -->
	<section id="whiteboard-dashboard" class="o-dashboard u-box-sizing--border-box u-display--grid u-padding--3 u-position--absolute-stretch">
		<!-- Dashboard / Whiteboard -->
		<div id="whiteboard-canvas" class="o-canvas o-canvas--hidden u-position--absolute-center">
			<canvas id="whiteboard-grid-canvas" class="c-canvas" width="0" height="0"></canvas>
			<canvas id="whiteboard-main-canvas" class="c-canvas u-position--absolute-stretch" width="0" height="0"></canvas>
			<div id="whiteboard-control" class="o-control u-position--absolute-stretch"></div>
		</div>
		<!-- Dashboard / Note -->
		<div id="whiteboard-note" class="o-note u-box-sizing--border-box u-opacity--0 u-pointer-events--none u-position--absolute">
			<div id="whiteboard-note-content" class="o-note-content" contenteditable spellcheck="false" placeholder="<?php echo $Translator->getString('{note_content_placeholder}'); ?>"></div>
		</div>
		<!-- Dashboard / Inputs -->
		<input id="whiteboard-source-file-input" class="u-border--none u-height--0 u-opacity--0 u-pointer-events--none u-position--absolute-center u-width--0" type="file" accept="application/json">
		<input id="whiteboard-image-input" class="u-border--none u-height--0 u-opacity--0 u-pointer-events--none u-position--absolute-center u-width--0" type="file" accept="image/gif, image/jpeg, image/png, image/bmp, image/webp">
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
					<div id="whiteboard-title" class="o-shelf-item-text o-shelf-first-item-text o-shelf-last-item-text u-line-height--48 u-overflow--hidden u-text-overflow--ellipsis u-white-space--nowrap" spellcheck="false" placeholder="<?php echo $Translator->getString('{title_placeholder}'); ?>"></div>
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
			<!-- Dashboard / Bottom / Left -->
			<section class="o-dashboard-bottom-left u-align-items--bottom u-display--inline-grid u-grid-auto-flow--row u-justify-content--left u-padding--3">
				<div class="o-shelf o-shelf--vertically u-display--grid u-grid-auto-flow--row u-justify-content--center u-position--relative u-shape-pill--48 u-z-index--2">
					<button id="whiteboard-tool-delete-button" class="js-tool-delete-button o-shelf-item o-shelf-first-item o-shelf-last-item c-button c-button--transparent c-button--hidden u-font-size--24 u-font-family--material-icons u-shape-pill--48" title="<?php echo $Translator->getString('{delete} (del)'); ?>">delete</button>
				</div>
				<div class="o-shelf o-shelf--vertically u-display--grid u-grid-auto-flow--row u-justify-content--center u-margin-top--6 u-position--relative u-shape-pill--48 u-z-index--2">
					<button id="whiteboard-tool-close-drawing-button" class="js-tool-close-button o-shelf-item o-shelf-first-item o-shelf-last-item c-button c-button--transparent c-button--active c-button--hidden u-font-size--24 u-font-family--material-icons u-shape-pill--48" title="<?php echo $Translator->getString('{drawing_close} (esc)'); ?>">gesture</button>
					<button id="whiteboard-tool-close-note-button" class="js-tool-close-button o-shelf-item o-shelf-first-item o-shelf-last-item c-button c-button--transparent c-button--active c-button--hidden u-font-size--24 u-font-family--material-icons u-shape-pill--48" title="<?php echo $Translator->getString('{note_close} (esc)'); ?>">notes</button>
					<button id="whiteboard-tool-close-image-button" class="js-tool-close-button o-shelf-item o-shelf-first-item o-shelf-last-item c-button c-button--transparent c-button--active c-button--hidden u-font-size--24 u-font-family--material-icons u-shape-pill--48" title="<?php echo $Translator->getString('{image_close} (esc)'); ?>">image</button>
					<button id="whiteboard-tool-close-shape-button" class="js-tool-close-button o-shelf-item o-shelf-first-item o-shelf-last-item c-button c-button--transparent c-button--active c-button--hidden u-font-size--24 u-font-family--material-icons u-shape-pill--48" title="<?php echo $Translator->getString('{shape_close} (esc)'); ?>">architecture</button>
				</div>
				<div class="o-shelf o-shelf--vertically u-display--grid u-grid-auto-flow--row u-justify-content--center u-position--relative u-shape-pill--48 u-z-index--2">
					<button id="whiteboard-upload-source-file-button" class="o-shelf-item o-shelf-first-item o-shelf-last-item c-button c-button--transparent u-font-size--24 u-font-family--material-icons u-shape-pill--48" title="<?php echo $Translator->getString('{source_file}'); ?>">file_upload</button>
				</div>
			</section>
			<!-- Dashboard / Bottom / Center -->
			<section class="o-dashboard-bottom-center u-align-items--center u-display--inline-grid u-grid-auto-flow--row u-justify-content--center u-padding--3">
				<div class="o-shelf o-shelf--horizontally u-align-items--center u-display--grid u-grid-auto-flow--column u-overflow--auto u-position--relative u-shape-pill--48 u-z-index--2">
					<input id="whiteboard-tool-property-fill-button" class="js-tool-property-button o-shelf-item c-button c-button--transparent c-button--hidden u-shape-pill--48" data-tool-type="drawing note shape" title="<?php echo $Translator->getString('{fill}'); ?>" type="color" value="#999999">
					<select id="whiteboard-tool-property-line-width-button" class="js-tool-property-button o-shelf-item-text c-button c-button--transparent c-button--hidden u-font-size--12 u-shape-pill--48" data-tool-type="drawing" title="<?php echo $Translator->getString('{line_width}'); ?>">
						<option value="1">1</option>
						<option value="2">2</option>
						<option value="3">3</option>
						<option value="4">4</option>
						<option value="5">5</option>
						<option value="6">6</option>
						<option value="8" selected>8</option>
						<option value="12">12</option>
						<option value="16">16</option>
						<option value="20">20</option>
						<option value="24">24</option>
						<option value="32">32</option>
						<option value="48">48</option>
					</select>
					<select id="whiteboard-tool-property-font-family-button" class="js-tool-property-button o-shelf-item-text c-button c-button--transparent c-button--hidden u-font-size--12 u-max-width--120 u-shape-pill--48 u-text-overflow--ellipsis" data-tool-type="note" title="<?php echo $Translator->getString('{font_family}'); ?>">
						<option value="Arial, sans-serif" style="font-family: Arial, sans-serif;" selected>Arial</option>
						<option value="Arial Black, sans-serif" style="font-family: Arial Black, sans-serif;">Arial Black</option>
						<option value="Brush Script MT, cursive" style="font-family: Brush Script MT, cursive;">Brush Script MT</option>
						<option value="Comic Sans MS, sans-serif" style="font-family: Comic Sans MS, sans-serif;">Comic Sans MS</option>
						<option value="Courier New, monospace" style="font-family: Courier New, monospace;">Courier New</option>
						<option value="Garamond, serif" style="font-family: Garamond, serif;">Garamond</option>
						<option value="Georgia, serif" style="font-family: Georgia, serif;">Georgia</option>
						<option value="Helvetica, sans-serif" style="font-family: Helvetica, sans-serif;">Helvetica</option>
						<option value="Impact, sans-serif" style="font-family: Impact, sans-serif;">Impact</option>
						<option value="Microsoft Sans Serif, sans-serif" style="font-family: Microsoft Sans Serif, sans-serif;">Microsoft Sans Serif</option>
						<option value="Tahoma, sans-serif" style="font-family: Tahoma, sans-serif;">Tahoma</option>
						<option value="Times New Roman, serif" style="font-family: Times New Roman, serif;">Times New Roman</option>
						<option value="Trebuchet MS, sans-serif" style="font-family: Trebuchet MS, sans-serif;">Trebuchet MS</option>
						<option value="Verdana, sans-serif" style="font-family: Verdana, sans-serif;">Verdana</option>
					</select>
					<select id="whiteboard-tool-property-font-size-button" class="js-tool-property-button o-shelf-item-text c-button c-button--transparent c-button--hidden u-font-size--12 u-shape-pill--48" data-tool-type="note" title="<?php echo $Translator->getString('{font_size}'); ?>">
						<option value="8">8</option>
						<option value="9">9</option>
						<option value="10">10</option>
						<option value="11">11</option>
						<option value="12" selected>12</option>
						<option value="14">14</option>
						<option value="16">16</option>
						<option value="18">18</option>
						<option value="20">20</option>
						<option value="22">22</option>
						<option value="24">24</option>
						<option value="26">26</option>
						<option value="28">28</option>
						<option value="36">36</option>
						<option value="48">48</option>
						<option value="72">72</option>
					</select>
					<button class="js-tool-property-button o-shelf-item c-button c-button--transparent c-button--hidden u-font-size--24 u-font-family--material-icons u-position--relative u-shape-pill--48" data-tool-type="note">
						<div id="whiteboard-tool-property-text-align-text">format_align_left</div>
						<select id="whiteboard-tool-property-text-align-button" class="u-cursor--pointer u-font-size--12 u-opacity--0 u-position--absolute-stretch" data-select-left-text="format_align_left" data-select-center-text="format_align_center" data-select-right-text="format_align_right" title="<?php echo $Translator->getString('{text_align}'); ?>">
							<optgroup label="<?php echo $Translator->getString('{text_align}'); ?>">
								<option value="left" selected><?php echo $Translator->getString('{text_align_left}'); ?></option>
								<option value="center"><?php echo $Translator->getString('{text_align_center}'); ?></option>
								<option value="right"><?php echo $Translator->getString('{text_align_right}'); ?></option>
							</optgroup>
						</select>
					</button>
					<button id="whiteboard-tool-property-src-button" class="js-tool-property-button o-shelf-item c-button c-button--transparent c-button--hidden u-font-size--24 u-font-family--material-icons u-shape-pill--48" data-tool-type="image" title="<?php echo $Translator->getString('{change_image}'); ?>">file_present</button>
					<select id="whiteboard-tool-property-shape-type-button" class="js-tool-property-button o-shelf-item-text c-button c-button--transparent c-button--hidden u-font-size--24 u-padding-bottom--6 u-shape-pill--48" data-tool-type="shape" title="<?php echo $Translator->getString('{shape_type}'); ?>">
						<option value="rectangle" title="<?php echo $Translator->getString('{rectangle}'); ?>" selected>▭</option>
						<option value="ellipse" title="<?php echo $Translator->getString('{ellipse}'); ?>">⬯</option>
						<option value="right_triangle" title="<?php echo $Translator->getString('{right_triangle}'); ?>">◺</option>
						<option value="isosceles_triangle" title="<?php echo $Translator->getString('{isosceles_triangle}'); ?>">△</option>
						<option value="rhombus" title="<?php echo $Translator->getString('{rhombus}'); ?>">◇</option>
					</select>
				</div>
				<div class="o-shelf o-shelf--horizontally u-align-items--center u-display--grid u-grid-auto-flow--column u-overflow--auto u-position--relative u-shape-pill--48 u-z-index--2">
					<button id="whiteboard-tool-type-drawing-button" class="js-tool-type-button o-shelf-item o-shelf-first-item c-button c-button--transparent u-font-size--24 u-font-family--material-icons u-shape-pill--48" title="<?php echo $Translator->getString('{drawing}'); ?>">gesture</button>
					<button id="whiteboard-tool-type-note-button" class="js-tool-type-button o-shelf-item c-button c-button--transparent u-font-size--24 u-font-family--material-icons u-shape-pill--48" title="<?php echo $Translator->getString('{note}'); ?>">notes</button>
					<button id="whiteboard-tool-type-image-button" class="js-tool-type-button o-shelf-item c-button c-button--transparent u-font-size--24 u-font-family--material-icons u-shape-pill--48" title="<?php echo $Translator->getString('{image}'); ?>">image</button>
					<button id="whiteboard-tool-type-shape-button" class="js-tool-type-button o-shelf-item o-shelf-last-item c-button c-button--transparent u-font-size--24 u-font-family--material-icons u-shape-pill--48" title="<?php echo $Translator->getString('{shape}'); ?>">architecture</button>
				</div>
			</section>
			<!-- Dashboard / Bottom / Right -->
			<section class="o-dashboard-bottom-right u-align-items--bottom u-display--inline-grid u-grid-auto-flow--row u-justify-content--right u-padding--3">
				<div class="o-shelf o-shelf--vertically u-display--grid u-grid-auto-flow--row u-justify-content--center u-position--relative u-shape-pill--48 u-z-index--2">
					<button id="whiteboard-grid" class="o-shelf-item o-shelf-first-item o-shelf-last-item c-button c-button--transparent u-font-size--24 u-font-family--material-icons u-shape-pill--48" title="<?php echo $Translator->getString('{grid_off} (g)'); ?>" data-grid-full-title="<?php echo $Translator->getString('{grid_full} (g)'); ?>" data-grid-full-html="grid_on" data-grid-off-title="<?php echo $Translator->getString('{grid_off} (g)'); ?>" data-grid-off-html="grid_off" data-grid-half-title="<?php echo $Translator->getString('{grid_half} (g)'); ?>" data-grid-half-html="window" onclick="whiteboard.toggleGrid();">grid_off</button>
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