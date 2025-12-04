'use client';

import { useLanguage } from '../i18n/LanguageContext';

export default function LanguageSwitcher() {
    const { language, setLanguage } = useLanguage();

    const toggleLanguage = () => {
        setLanguage(language === 'en' ? 'ja' : 'en');
    };

    return (
        <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${language === 'en' ? 'text-white' : 'text-gray-400'}`}>EN</span>
            <label className="relative inline-flex items-center cursor-pointer">
                <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={language === 'ja'}
                    onChange={toggleLanguage}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
            <span className={`text-sm font-medium ${language === 'ja' ? 'text-white' : 'text-gray-400'}`}>JA</span>
        </div>
    );
}
