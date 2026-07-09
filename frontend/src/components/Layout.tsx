import React from 'react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // TODO: Додати кнопку Logout (видалення JWT токена з сесії/localStorage).
    // TODO: Кнопка Logout повинна бути доступна на будь-якій сторінці додатку!
    // TODO: Реалізувати адаптивність (Responsive) — перевірити відображення меню на мобільних та десктопах.

    return (
        <div className="app-layout">
            <header>
                <nav>MatchMe Navigation</nav>
            </header>
            <main>{children}</main>
        </div>
    );
};