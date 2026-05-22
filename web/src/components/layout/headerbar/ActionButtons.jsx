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
import { Link } from 'react-router-dom';
import { FileText, Handshake } from 'lucide-react';
import NewYearButton from './NewYearButton';
import LanguageSelector from './LanguageSelector';
import UserArea from './UserArea';

const ActionButtons = ({
  isNewYear,
  isWorkspaceRoute,
  rightNavLinks = [],
  currentLang,
  onLanguageChange,
  userState,
  isLoading,
  isMobile,
  isSelfUseMode,
  logout,
  navigate,
  t,
}) => {
  const renderRightNavLink = (link) => {
    const className = `header-action-link ${
      link.itemKey === 'docs'
        ? 'header-action-link-primary'
        : 'header-action-link-secondary'
    }`;
    const content = (
      <>
        {link.itemKey === 'docs' ? (
          <FileText size={15} />
        ) : (
          <Handshake size={15} />
        )}
        <span>{link.text}</span>
      </>
    );

    if (link.isExternal) {
      return (
        <a
          key={link.itemKey}
          href={link.externalLink}
          target='_blank'
          rel='noopener noreferrer'
          className={className}
        >
          {content}
        </a>
      );
    }

    return (
      <Link key={link.itemKey} to={link.to} className={className}>
        {content}
      </Link>
    );
  };

  return (
    <div className='headerbar-actions flex items-center gap-2 md:gap-3'>
      <NewYearButton isNewYear={isNewYear} />

      {isWorkspaceRoute && rightNavLinks.length > 0 && (
        <div className='header-action-links'>
          {rightNavLinks.map(renderRightNavLink)}
        </div>
      )}

      {!isWorkspaceRoute && (
        <LanguageSelector
          currentLang={currentLang}
          onLanguageChange={onLanguageChange}
          t={t}
        />
      )}

      <UserArea
        userState={userState}
        isLoading={isLoading}
        isMobile={isMobile}
        isSelfUseMode={isSelfUseMode}
        logout={logout}
        navigate={navigate}
        t={t}
      />
    </div>
  );
};

export default ActionButtons;
