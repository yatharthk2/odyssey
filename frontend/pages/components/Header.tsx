import React from "react";
import config from "../index.json";
import Link from "next/link";

const Header = () => {
  const navigation = config.navigation;
  return (
    <div className="header">
      <div className="header__menu">
        <ul className="flex px-8 lg:px-32 gap-x-10 content-center leading-0 h-0">
          {navigation.map((item) => (
            <li className="mt-6 cursor-pointer" key={item.title}>
              {item.url.startsWith('/') ? (
                <Link href={item.url} legacyBehavior>
                  <a className="whitespace-nowrap font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                    {item.title}
                  </a>
                </Link>
              ) : (
                <a href={item.url}>
                  {item.title}
                </a>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Header;