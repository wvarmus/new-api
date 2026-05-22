/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

import React from 'react';
import { useHeaderBar } from '../../../hooks/common/useHeaderBar';
import { useNavigation } from '../../../hooks/common/useNavigation';
import MobileMenuButton from './MobileMenuButton';
import HeaderLogo from './HeaderLogo';
import Navigation from './Navigation';
import ActionButtons from './ActionButtons';
import { getHeaderContainerClass } from './headerbarLayout';

const HeaderBar = ({ onMobileMenuToggle, drawerOpen }) => {
  const {
    userState,
    isMobile,
    collapsed,
    logoLoaded,
    currentLang,
    isLoading,
    systemName,
    logo,
    isNewYear,
    isSelfUseMode,
    docsLink,
    partnershipPromoterEnabled,
    isDemoSiteMode,
    isSidebarRoute,
    isWorkspaceRoute,
    headerNavModules,
    pricingRequireAuth,
    logout,
    handleLanguageChange,
    handleMobileMenuToggle,
    navigate,
    t,
  } = useHeaderBar({ onMobileMenuToggle, drawerOpen });

  const { mainNavLinks } = useNavigation(
    t,
    docsLink,
    headerNavModules,
    partnershipPromoterEnabled,
  );
  const rightNavLinks = [];

  return (
    <header className='text-semi-color-text-0'>
      <nav
        id='nav'
        className={`header-nav-solid sticky top-0 z-50 w-full transition-colors ${
          isWorkspaceRoute
            ? 'header-nav-workspace'
            : 'border-b border-[#f3f4f6]'
        }`}
      >
        <div className={getHeaderContainerClass(isWorkspaceRoute)}>
          <div className='flex min-w-0 items-center gap-4 xl:gap-8'>
            <MobileMenuButton
              isConsoleRoute={isSidebarRoute}
              isMobile={isMobile}
              drawerOpen={drawerOpen}
              collapsed={collapsed}
              onToggle={handleMobileMenuToggle}
              t={t}
            />

            <HeaderLogo
              isMobile={isMobile}
              isConsoleRoute={isSidebarRoute}
              logo={logo}
              logoLoaded={logoLoaded}
              isLoading={isLoading}
              systemName={systemName}
              isSelfUseMode={isSelfUseMode}
              isDemoSiteMode={isDemoSiteMode}
              t={t}
            />

            <Navigation
              mainNavLinks={mainNavLinks}
              isMobile={isMobile}
              isLoading={isLoading}
              userState={userState}
              pricingRequireAuth={pricingRequireAuth}
            />
          </div>

          <ActionButtons
            isNewYear={isNewYear}
            isWorkspaceRoute={isWorkspaceRoute}
            rightNavLinks={rightNavLinks}
            currentLang={currentLang}
            onLanguageChange={handleLanguageChange}
            userState={userState}
            isLoading={isLoading}
            isMobile={isMobile}
            isSelfUseMode={isSelfUseMode}
            logout={logout}
            navigate={navigate}
            t={t}
          />
        </div>
      </nav>
    </header>
  );
};

export default HeaderBar;
