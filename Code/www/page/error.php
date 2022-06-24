<main id="whiteboard-main" class="s-theme--dark u-position--absolute-stretch" data-theme="auto">
	<!-- Dashboard -->
	<section id="whiteboard-dashboard" class="o-dashboard o-dashboard--visible u-box-sizing--border-box u-display--grid u-padding--3 u-position--absolute-stretch">
		<!-- Dashboard / Top -->
		<section class="o-dashboard-top u-display--grid">
			<!-- Dashboard / Top / Right -->
			<section class="o-dashboard-top-right u-align-items--center u-display--inline-grid u-grid-auto-flow--column u-justify-content--center u-padding--3">
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
					<button id="whiteboard-theme" class="o-shelf-item o-shelf-first-item o-shelf-last-item c-button c-button--transparent u-font-size--24 u-font-family--material-icons u-shape-circle--48" title="<?php echo $Translator->getString('{theme_dark} (t)'); ?>" data-theme-auto-title="<?php echo $Translator->getString('{theme_auto} (t)'); ?>" data-theme-auto-html="brightness_auto" data-theme-dark-title="<?php echo $Translator->getString('{theme_dark} (t)'); ?>" data-theme-dark-html="nights_stay" data-theme-light-title="<?php echo $Translator->getString('{theme_light} (t)'); ?>" data-theme-light-html="wb_sunny" onclick="err.toggleTheme();">nights_stay</button>
				</div>
			</section>
		</section>
		<!-- Dashboard / Middle -->
		<section class="o-dashboard-middle u-display--grid u-overflow--hidden u-padding--3">
			<!-- Dashboard / Middle / Center -->
			<section class="o-dashboard-middle-center u-align-items--center u-display--inline-grid u-grid-auto-flow--row u-max-height--100p u-justify-content--stretch u-overflow--auto">
				<div class="o-title u-font-size--24 u-margin-vertically--12 u-padding-bottom--6">
					<div><?php echo $Page->getTitle(); ?></div>
				</div>
			</section>
		</section>
	</section>
</main>