<?php
/*
	[www.7ree.com] (C)2007-2016 7ree.com.
	Update: 2016/10/22 15:24
	This is NOT a freeware, use is subject to license terms
	Agreement: http://addon.dismall.com/?@7.developer.doc/agreement_7ree_html
	More Plugins: http://addon.dismall.com/?@7ree
*/

if(!defined('IN_DISCUZ')) {
	exit('Access Denied');
}


	class plugin_noaddonhint_7ree{

			function global_footerlink() {
				global $_G;
				$return = "";
				$vars_7ree = $_G['cache']['plugin']['noaddonhint_7ree'];
				if(empty($_G['cookie']['pluginnotice']) && $vars_7ree['agreement_7ree'] && $vars_7ree['onoff_7ree']){
					$_G['cookie']['pluginnotice'] = 1;
				}
				return $return;
			}

	}

	class plugin_noaddonhint_7ree_forum extends plugin_noaddonhint_7ree{}
	class plugin_noaddonhint_7ree_home extends plugin_noaddonhint_7ree{}
	class plugin_noaddonhint_7ree_group extends plugin_noaddonhint_7ree{}
	class plugin_noaddonhint_7ree_portal extends plugin_noaddonhint_7ree{}
	class plugin_noaddonhint_7ree_userapp extends plugin_noaddonhint_7ree{}
	class plugin_noaddonhint_7ree_member extends plugin_noaddonhint_7ree{}
	class plugin_noaddonhint_7ree_ranklist extends plugin_noaddonhint_7ree{}
	class plugin_noaddonhint_7ree_plugin extends plugin_noaddonhint_7ree{}

?>