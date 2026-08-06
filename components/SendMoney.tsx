import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';
import { Wallet, ArrowLeft, ShieldCheck, Coins, Check, AlertCircle, RefreshCw, Star, ArrowUpRight, Ban, Building, User as UserIcon } from 'lucide-react';
import { User } from '../types';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

interface SendMoneyProps {
  user: User;
  onTransfer: (amount: number, recipientInfo: string) => void;
  onSubscribeRedirect: () => void;
  onGoHome: (showFailedMessage?: boolean) => void;
  onRequestFreeWithdrawal?: () => void;
}

const BANKS_DATA = [
  {"id":"825.0", "code":"000019", "name":"Enterprise Bank"}, {"id":"645.0", "code":"100004", "name":"OPay"}, {"id":"964.0", "code":"000025", "name":"Titan Trust Bank"}, {"id":"785.0", "code":"100033", "name":"PalmPay"}, {"id":"301.0", "code":"000027", "name":"Globus Bank"}, {"id":"1978.0", "code":"000028", "name":"Central Bank Of Nigeria"}, {"id":"1977.0", "code":"000029", "name":"Lotus Bank"}, {"id":"988.0", "code":"000030", "name":"Parallex Bank"}, {"id":"1318.0", "code":"000031", "name":"PremiumTrust Bank"}, {"id":"1355.0", "code":"000033", "name":"ENaira"}, {"id":"2050.0", "code":"000034", "name":"SIGNATURE BANK"}, {"id":"2010.0", "code":"000036", "name":"Optimus Bank"}, {"id":"2298.0", "code":"000037", "name":"ALTERNATIVE BANK LIMITED"}, {"id":"5.0", "code":"011", "name":"First Bank PLC"}, {"id":"2.0", "code":"023", "name":"Citi Bank"}, {"id":"14.0", "code":"032", "name":"Union Bank PLC"}, {"id":"13.0", "code":"033", "name":"United Bank for Africa"}, {"id":"15.0", "code":"035", "name":"Wema Bank PLC"}, {"id":"1.0", "code":"044", "name":"Access Bank"}, {"id":"4.0", "code":"050", "name":"EcoBank PLC"}, {"id":"1976.0", "code":"050001", "name":"County Finance Ltd"}, {"id":"1975.0", "code":"050002", "name":"Fewchore Finance Company Limited"}, {"id":"1974.0", "code":"050003", "name":"Sagegrey Finance Limited"}, {"id":"1973.0", "code":"050004", "name":"Newedge Finance Ltd"}, {"id":"1972.0", "code":"050005", "name":"Aaa Finance"}, {"id":"1971.0", "code":"050006", "name":"Branch International Finance Company Limited"}, {"id":"2042.0", "code":"050007", "name":"Tekla Finance Ltd"}, {"id":"2072.0", "code":"050008", "name":"SIMPLE FINANCE LIMITED"}, {"id":"2035.0", "code":"050009", "name":"FAST CREDIT"}, {"id":"2048.0", "code":"050010", "name":"FUNDQUEST FINANCIAL SERVICES LTD"}, {"id":"2056.0", "code":"050012", "name":"Enco Finance"}, {"id":"2060.0", "code":"050013", "name":"Dignity Finance"}, {"id":"2067.0", "code":"050014", "name":"TRINITY FINANCIAL SERVICES LIMITED"}, {"id":"2891.0", "code":"050019", "name":"ZEDVANCE FINANCE LIMITED"}, {"id":"2299.0", "code":"050020", "name":"VALE FINANCE LIMITED"}, {"id":"16.0", "code":"057", "name":"Zenith bank PLC"}, {"id":"8.0", "code":"058", "name":"Guaranty Trust Bank"}, {"id":"826.0", "code":"060001", "name":"Coronation Merchant Bank"}, {"id":"827.0", "code":"060002", "name":"FBNQUEST Merchant Bank"}, {"id":"828.0", "code":"060003", "name":"Nova Merchant Bank"}, {"id":"987.0", "code":"060004", "name":"Greenwich Merchant Bank"}, {"id":"11.0", "code":"068", "name":"Standard Chaterted bank PLC"}, {"id":"7.0", "code":"070", "name":"Fidelity Bank"}, {"id":"811.0", "code":"070001", "name":"NPF MicroFinance Bank"}, {"id":"847.0", "code":"070002", "name":"Fortis Microfinance Bank"}, {"id":"659.0", "code":"070006", "name":"Covenant Microfinance Bank"}, {"id":"829.0", "code":"070007", "name":"Omoluabi savings and loans"}, {"id":"848.0", "code":"070008", "name":"Page Financials"}, {"id":"836.0", "code":"070009", "name":"Gateway Mortgage Bank"}, {"id":"837.0", "code":"070010", "name":"Abbey Mortgage Bank"}, {"id":"838.0", "code":"070011", "name":"Refuge Mortgage Bank"}, {"id":"839.0", "code":"070012", "name":"Lagos Building Investment Company"}, {"id":"840.0", "code":"070013", "name":"Platinum Mortgage Bank"}, {"id":"841.0", "code":"070014", "name":"First Generation Mortgage Bank"}, {"id":"842.0", "code":"070015", "name":"Brent Mortgage Bank"}, {"id":"843.0", "code":"070016", "name":"Infinity Trust Mortgage Bank"}, {"id":"845.0", "code":"070017", "name":"Haggai Mortgage Bank Limited"}, {"id":"1970.0", "code":"070019", "name":"Mayfresh Mortgage Bank"}, {"id":"1969.0", "code":"070021", "name":"Coop Mortgage Bank"}, {"id":"1968.0", "code":"070022", "name":"Stb Mortgage Bank"}, {"id":"1967.0", "code":"070023", "name":"Delta Trust Mortgage Bank"}, {"id":"1966.0", "code":"070024", "name":"Homebase Mortgage"}, {"id":"1965.0", "code":"070025", "name":"Akwa Savings & Loans Limited"}, {"id":"1964.0", "code":"070026", "name":"Fha Mortgage Bank Ltd"}, {"id":"9.0", "code":"076", "name":"Polaris bank"}, {"id":"1963.0", "code":"080002", "name":"Tajwallet"}, {"id":"183.0", "code":"082", "name":"Keystone Bank"}, {"id":"830.0", "code":"090001", "name":"ASOSavings & Loans"}, {"id":"844.0", "code":"090003", "name":"Jubilee-Life Mortgage  Bank"}, {"id":"849.0", "code":"090004", "name":"Parralex Microfinance bank"}, {"id":"831.0", "code":"090005", "name":"Trustbond Mortgage Bank"}, {"id":"832.0", "code":"090006", "name":"SafeTrust "}, {"id":"850.0", "code":"090097", "name":"Ekondo MFB"}, {"id":"2890.0", "code":"090107", "name":"FIRSTTRUST MORTGAGE BANK"}, {"id":"846.0", "code":"090108", "name":"New Prudential Bank"}, {"id":"660.0", "code":"090110", "name":"VFD Micro Finance Bank"}, {"id":"851.0", "code":"090112", "name":"Seed Capital Microfinance Bank"}, {"id":"1962.0", "code":"090113", "name":"Microvis Microfinance Bank"}, {"id":"852.0", "code":"090114", "name":"Empire trust MFB"}, {"id":"258.0", "code":"090115", "name":"IBANK Microfinance Bank"}, {"id":"853.0", "code":"090116", "name":"AMML MFB"}, {"id":"854.0", "code":"090117", "name":"Boctrust Microfinance Bank"}, {"id":"855.0", "code":"090118", "name":"IBILE Microfinance Bank"}, {"id":"856.0", "code":"090119", "name":"Ohafia Microfinance Bank"}, {"id":"857.0", "code":"090120", "name":"Wetland Microfinance Bank"}, {"id":"858.0", "code":"090121", "name":"Hasal Microfinance Bank"}, {"id":"859.0", "code":"090122", "name":"Gowans Microfinance Bank"}, {"id":"860.0", "code":"090123", "name":"Verite Microfinance Bank"}, {"id":"861.0", "code":"090124", "name":"Xslnce Microfinance Bank"}, {"id":"862.0", "code":"090125", "name":"Regent Microfinance Bank"}, {"id":"863.0", "code":"090126", "name":"Fidfund Microfinance Bank"}, {"id":"864.0", "code":"090127", "name":"BC Kash Microfinance Bank"}, {"id":"865.0", "code":"090128", "name":"Ndiorah Microfinance Bank"}, {"id":"866.0", "code":"090129", "name":"Money Trust Microfinance Bank"}, {"id":"867.0", "code":"090130", "name":"Consumer Microfinance Bank"}, {"id":"868.0", "code":"090131", "name":"Allworkers Microfinance Bank"}, {"id":"869.0", "code":"090132", "name":"Richway Microfinance Bank"}, {"id":"870.0", "code":"090133", "name":" AL-Barakah Microfinance Bank"}, {"id":"871.0", "code":"090134", "name":"Accion Microfinance Bank"}, {"id":"872.0", "code":"090135", "name":"Personal Trust Microfinance Bank"}, {"id":"873.0", "code":"090136", "name":"Baobab Microfinance Bank"}, {"id":"874.0", "code":"090137", "name":"PecanTrust Microfinance Bank"}, {"id":"875.0", "code":"090138", "name":"Royal Exchange Microfinance Bank"}, {"id":"876.0", "code":"090139", "name":"Visa Microfinance Bank"}, {"id":"877.0", "code":"090140", "name":"Sagamu Microfinance Bank"}, {"id":"878.0", "code":"090141", "name":"Chikum Microfinance Bank"}, {"id":"879.0", "code":"090142", "name":"Yes Microfinance Bank"}, {"id":"880.0", "code":"090143", "name":"Apeks Microfinance Bank"}, {"id":"881.0", "code":"090144", "name":"CIT Microfinance Bank"}, {"id":"882.0", "code":"090145", "name":"Fullrange Microfinance Bank"}, {"id":"883.0", "code":"090146", "name":"Trident Microfinance Bank"}, {"id":"884.0", "code":"090147", "name":"Hackman Microfinance Bank"}, {"id":"885.0", "code":"090148", "name":"Bowen Microfinance Bank"}, {"id":"886.0", "code":"090149", "name":"IRL Microfinance Bank"}, {"id":"887.0", "code":"090150", "name":"Virtue Microfinance Bank"}, {"id":"888.0", "code":"090151", "name":"Mutual Trust Microfinance Bank"}, {"id":"889.0", "code":"090152", "name":"Nagarta Microfinance Bank"}, {"id":"890.0", "code":"090153", "name":"FFS Microfinance Bank"}, {"id":"891.0", "code":"090154", "name":"CEMCS Microfinance Bank"}, {"id":"892.0", "code":"090155", "name":"La  Fayette Microfinance Bank"}, {"id":"893.0", "code":"090156", "name":"e-Barcs Microfinance Bank"}, {"id":"894.0", "code":"090157", "name":"Infinity Microfinance Bank"}, {"id":"895.0", "code":"090158", "name":"Futo Microfinance Bank"}, {"id":"896.0", "code":"090160", "name":"Credit Afrique Microfinance Bank"}, {"id":"897.0", "code":"090161", "name":"Addosser Microfinance Bank"}, {"id":"898.0", "code":"090162", "name":"Okpoga Microfinance Bank"}, {"id":"899.0", "code":"090163", "name":"Stanford Microfinance Bak"}, {"id":"1961.0", "code":"090164", "name":"First Multiple Microfinance Bank"}, {"id":"900.0", "code":"090165", "name":"First Royal Microfinance Bank"}, {"id":"901.0", "code":"090166", "name":"Petra Microfinance Bank"}, {"id":"902.0", "code":"090167", "name":"Eso-E Microfinance Bank"}, {"id":"903.0", "code":"090168", "name":"Daylight Microfinance Bank"}, {"id":"904.0", "code":"090169", "name":"Gashua Microfinance Bank"}, {"id":"905.0", "code":"090170", "name":"Alpha Kapital Microfinance Bank"}, {"id":"1960.0", "code":"090171", "name":"Rahama Microfinance Bank"}, {"id":"906.0", "code":"090172", "name":"Mainstreet Microfinance Bank"}, {"id":"907.0", "code":"090173", "name":"Astrapolaris Microfinance Bank"}, {"id":"908.0", "code":"090174", "name":"Reliance Microfinance Bank"}, {"id":"909.0", "code":"090175", "name":"Malachy Microfinance Bank"}, {"id":"253.0", "code":"090176", "name":"Rubies Microfinance Bank"}, {"id":"911.0", "code":"090177", "name":"Bosak Microfinance Bank"}, {"id":"912.0", "code":"090178", "name":"Lapo Microfinance Bank"}, {"id":"913.0", "code":"090179", "name":"GreenBank Microfinance Bank"}, {"id":"914.0", "code":"090180", "name":"FAST Microfinance Bank"}, {"id":"597.0", "code":"090181", "name":"AMJU Unique Microfinance Bank"}, {"id":"1959.0", "code":"090182", "name":"Balogun Fulani  Microfinance Bank"}, {"id":"1958.0", "code":"090186", "name":"Standard Microfinance Bank"}, {"id":"1957.0", "code":"090188", "name":"Girei Microfinance Bank"}, {"id":"915.0", "code":"090189", "name":"Baines Credit Microfinance Bank"}, {"id":"916.0", "code":"090190", "name":"Esan Microfinance Bank"}, {"id":"917.0", "code":"090191", "name":"Mutual Benefits Microfinance Bank"}, {"id":"918.0", "code":"090192", "name":"KCMB Microfinance Bank"}, {"id":"919.0", "code":"090193", "name":"Midland Microfinance Bank"}, {"id":"920.0", "code":"090194", "name":"Unical Microfinance Bank"}, {"id":"921.0", "code":"090195", "name":"NIRSAL Microfinance Bank"}, {"id":"922.0", "code":"090196", "name":"Grooming Microfinance Bank"}, {"id":"923.0", "code":"090197", "name":"Pennywise Microfinance Bank"}, {"id":"924.0", "code":"090198", "name":"ABU Microfinance Bank"}, {"id":"925.0", "code":"090201", "name":"RenMoney Microfinance Bank"}, {"id":"1956.0", "code":"090202", "name":"Xpress Payments"}, {"id":"1955.0", "code":"090205", "name":"Accelerex Network"}, {"id":"926.0", "code":"090211", "name":"New Dawn Microfinance Bank"}, {"id":"1954.0", "code":"090251", "name":"Itex Integrated Services Limited"}, {"id":"927.0", "code":"090252", "name":"UNN MFB"}, {"id":"1953.0", "code":"090254", "name":"Yobe Microfinance Bank"}, {"id":"1952.0", "code":"090258", "name":"Coalcamp Microfinance Bank"}, {"id":"928.0", "code":"090259", "name":"Imo State Microfinance Bank"}, {"id":"929.0", "code":"090260", "name":"Alekun Microfinance Bank"}, {"id":"930.0", "code":"090261", "name":"Above Only Microfinance Bank"}, {"id":"931.0", "code":"090262", "name":"Quickfund Microfinance Bank"}, {"id":"932.0", "code":"090263", "name":"Stellas Microfinance Bank"}, {"id":"933.0", "code":"090264", "name":"Navy Microfinance Bank"}, {"id":"934.0", "code":"090265", "name":"Auchi Microfinance Bank"}, {"id":"935.0", "code":"090266", "name":"Lovonus Microfinance Bank"}, {"id":"936.0", "code":"090267", "name":"Uniben Microfinance Bank"}, {"id":"254.0", "code":"090268", "name":"Kuda"}, {"id":"937.0", "code":"090269", "name":"Adeyemi College Staff Microfinance Bank"}, {"id":"938.0", "code":"090270", "name":"Greenville Microfinance Bank"}, {"id":"939.0", "code":"090271", "name":"AB Microfinance Bank"}, {"id":"940.0", "code":"090272", "name":"Lavender Microfinance Bank"}, {"id":"941.0", "code":"090273", "name":"Olabisi Onabanjo University Microfinance Bank"}, {"id":"942.0", "code":"090274", "name":"Emeralds Microfinance Bank"}, {"id":"1951.0", "code":"090275", "name":"Prestige Microfinance Bank"}, {"id":"1950.0", "code":"090276", "name":"BANKIT MFB"}, {"id":"943.0", "code":"090277", "name":"Trustfund Microfinance Bank"}, {"id":"944.0", "code":"090278", "name":"Al-Hayat Microfinance Bank"}, {"id":"1949.0", "code":"090279", "name":"Glory Microfinance Bank "}, {"id":"1948.0", "code":"090280", "name":"Ikire Microfinance Bank"}, {"id":"1947.0", "code":"090281", "name":"Megapraise Microfinance Bank"}, {"id":"640.0", "code":"090282", "name":"Mint-Finex MICROFINANCE BANK"}, {"id":"1946.0", "code":"090283", "name":"Arise Microfinance Bank"}, {"id":"1945.0", "code":"090285", "name":"Thrive Microfinance Bank"}, {"id":"1944.0", "code":"090286", "name":"First Option Microfinance Bank"}, {"id":"996.0", "code":"090287", "name":"Safe Haven MFB"}, {"id":"1943.0", "code":"090289", "name":"Assets Matrix Microfinance Bank"}, {"id":"1942.0", "code":"090290", "name":"Pillar Microfinance Bank"}, {"id":"1941.0", "code":"090291", "name":"Fct Microfinance Bank"}, {"id":"1940.0", "code":"090292", "name":"Halacredit Microfinance Bank"}, {"id":"1939.0", "code":"090293", "name":"Afekhafe Microfinance Bank"}, {"id":"1938.0", "code":"090294", "name":"Brethren Microfinance Bank"}, {"id":"1937.0", "code":"090295", "name":"Eagle Flight Microfinance Bank"}, {"id":"1936.0", "code":"090296", "name":"Omiye Microfinance Bank"}, {"id":"1935.0", "code":"090297", "name":"Polyuwanna Microfinance Bank"}, {"id":"1934.0", "code":"090298", "name":"Alert Microfinance Bank"}, {"id":"1933.0", "code":"090299", "name":"Federalpoly Nasarawamfb"}, {"id":"1932.0", "code":"090302", "name":"Kontagora Microfinance Bank"}, {"id":"1931.0", "code":"090303", "name":"Sunbeam Microfinance Bank"}, {"id":"1930.0", "code":"090304", "name":"Purplemoney Microfinance Bank"}, {"id":"1929.0", "code":"090305", "name":"Evangel Microfinance Bank"}, {"id":"1928.0", "code":"090307", "name":"Sulsap Microfinance Bank"}, {"id":"1927.0", "code":"090308", "name":"Aramoko Microfinance Bank"}, {"id":"1926.0", "code":"090310", "name":"Brightway Microfinance Bank"}, {"id":"1925.0", "code":"090315", "name":"Edfin Microfinance Bank"}, {"id":"1924.0", "code":"090316", "name":"U And C Microfinance Bank"}, {"id":"1923.0", "code":"090317", "name":"Bayero Microfinance Bank"}, {"id":"661.0", "code":"090318", "name":"PatrickGold Microfinance Bank"}, {"id":"1922.0", "code":"090319", "name":"Federal University Dutse  Microfinance Bank"}, {"id":"1921.0", "code":"090320", "name":"Bonghe Microfinance Bank"}, {"id":"1920.0", "code":"090321", "name":"Kadpoly Microfinance Bank"}, {"id":"1919.0", "code":"090322", "name":"Mayfair  Microfinance Bank"}, {"id":"1918.0", "code":"090323", "name":"Rephidim Microfinance Bank"}, {"id":"1917.0", "code":"090324", "name":"Mainland Microfinance Bank"}, {"id":"1916.0", "code":"090325", "name":"Ikenne Microfinance Bank"}, {"id":"728.0", "code":"090326", "name":"Sparkle"}, {"id":"1915.0", "code":"090327", "name":"Balogun Gambari Microfinance Bank"}, {"id":"1914.0", "code":"090328", "name":"Trust Microfinance Bank"}, {"id":"639.0", "code":"090329", "name":"Eyowo MFB"}, {"id":"1913.0", "code":"090330", "name":"Neptune Microfinance Bank"}, {"id":"1912.0", "code":"090331", "name":"Fame Microfinance Bank"}, {"id":"1911.0", "code":"090332", "name":"Unaab Microfinance Bank"}, {"id":"1910.0", "code":"090333", "name":"Evergreen Microfinance Bank"}, {"id":"1909.0", "code":"090335", "name":"Oche Microfinance Bank"}, {"id":"2034.0", "code":"090336", "name":"Grant MF Bank"}, {"id":"1908.0", "code":"090337", "name":"Bipc Microfinance Bank"}, {"id":"1907.0", "code":"090338", "name":"Iyeru Okin Microfinance Bank Ltd"}, {"id":"1906.0", "code":"090340", "name":"Uniuyo Microfinance Bank"}, {"id":"1905.0", "code":"090341", "name":"Stockcorp  Microfinance Bank"}, {"id":"1904.0", "code":"090343", "name":"Unilorin Microfinance Bank"}, {"id":"1903.0", "code":"090345", "name":"Citizen Trust Microfinance Bank Ltd"}, {"id":"1902.0", "code":"090349", "name":"Oau Microfinance Bank Ltd"}, {"id":"1901.0", "code":"090350", "name":"Nasarawa Microfinance Bank"}, {"id":"1900.0", "code":"090352", "name":"Illorin Microfinance Bank"}, {"id":"1899.0", "code":"090353", "name":"Jessefield Microfinance Bank"}, {"id":"1898.0", "code":"090360", "name":"Isuofia Microfinance Bank"}, {"id":"1897.0", "code":"090362", "name":"Cashconnect   Microfinance Bank"}, {"id":"1896.0", "code":"090363", "name":"Molusi Microfinance Bank"}, {"id":"1895.0", "code":"090364", "name":"Headway Microfinance Bank"}, {"id":"1894.0", "code":"090365", "name":"Nuture Microfinance Bank"}, {"id":"1893.0", "code":"090366", "name":"Corestep Microfinance Bank"}, {"id":"989.0", "code":"090369", "name":"Firmus MFB"}, {"id":"1892.0", "code":"090370", "name":"Seedvest Microfinance Bank"}, {"id":"1891.0", "code":"090371", "name":"Ilasan Microfinance Bank"}, {"id":"1890.0", "code":"090372", "name":"Agosasa Microfinance Bank"}, {"id":"1889.0", "code":"090373", "name":"Legend Microfinance Bank"}, {"id":"1888.0", "code":"090374", "name":"Tf Microfinance Bank"}, {"id":"1887.0", "code":"090376", "name":"Coastline Microfinance Bank"}, {"id":"1886.0", "code":"090377", "name":"Apple  Microfinance Bank"}, {"id":"1885.0", "code":"090378", "name":"Isaleoyo Microfinance Bank"}, {"id":"1884.0", "code":"090379", "name":"New Golden Pastures Microfinance Bank"}, {"id":"1883.0", "code":"090380", "name":"Peniel Micorfinance Bank Ltd"}, {"id":"1882.0", "code":"090383", "name":"Kredi Money Microfinance Bank"}, {"id":"992.0", "code":"090385", "name":"Manny Microfinance bank"}, {"id":"1881.0", "code":"090386", "name":"Gti  Microfinance Bank"}, {"id":"1880.0", "code":"090389", "name":"Interland Microfinance Bank"}, {"id":"1879.0", "code":"090390", "name":"Ek-Reliable Microfinance Bank"}, {"id":"1878.0", "code":"090391", "name":"Davodani  Microfinance Bank"}, {"id":"1879.0", "code":"090392", "name":"Mozfin Microfinance Bank"}, {"id":"638.0", "code":"090393", "name":"BRIDGEWAY MICROFINANCE BANK"}, {"id":"1875.0", "code":"090394", "name":"Amac Microfinance Bank"}, {"id":"1874.0", "code":"090395", "name":"Borgu Microfinance Bank"}, {"id":"1873.0", "code":"090396", "name":"Oscotech Microfinance Bank"}, {"id":"1872.0", "code":"090397", "name":"Chanelle Bank"}, {"id":"1871.0", "code":"090398", "name":"Federal Polytechnic Nekede Microfinance Bank"}, {"id":"1870.0", "code":"090399", "name":"Nwannegadi Microfinance Bank"}, {"id":"1869.0", "code":"090400", "name":"Finca Microfinance Bank"}, {"id":"1868.0", "code":"090401", "name":"Shepherd Trust Microfinance Bank"}, {"id":"1867.0", "code":"090402", "name":"Peace Microfinance Bank"}, {"id":"1866.0", "code":"090403", "name":"Uda Microfinance Bank"}, {"id":"1865.0", "code":"090404", "name":"Olowolagba Microfinance Bank"}, {"id":"1864.0", "code":"090405", "name":"Moniepoint Microfinance Bank"}, {"id":"1863.0", "code":"090406", "name":"Business Support Microfinance Bank"}, {"id":"1862.0", "code":"090408", "name":"Gmb Microfinance Bank"}, {"id":"1861.0", "code":"090409", "name":"Fcmb Microfinance Bank"}, {"id":"1860.0", "code":"090410", "name":"Maritime Microfinance Bank"}, {"id":"1859.0", "code":"090411", "name":"Giginya Microfinance Bank"}, {"id":"1858.0", "code":"090412", "name":"Preeminent Microfinance Bank"}, {"id":"1857.0", "code":"090413", "name":"Benysta Microfinance Bank"}, {"id":"1856.0", "code":"090414", "name":"Crutech  Microfinance Bank"}, {"id":"1855.0", "code":"090415", "name":"Calabar Microfinance Bank"}, {"id":"1854.0", "code":"090416", "name":"Chibueze Microfinance Bank"}, {"id":"1853.0", "code":"090417", "name":"Imowo Microfinance Bank"}, {"id":"1852.0", "code":"090418", "name":"Highland Microfinance Bank"}, {"id":"1851.0", "code":"090419", "name":"Winview Bank"}, {"id":"994.0", "code":"090420", "name":"Letshego MFB"}, {"id":"1850.0", "code":"090421", "name":"Izon Microfinance Bank"}, {"id":"1849.0", "code":"090422", "name":"Landgold  Microfinance Bank"}, {"id":"986.0", "code":"090423", "name":"MAUTECH Microfinance Bank"}, {"id":"1848.0", "code":"090424", "name":"Abucoop  Microfinance Bank"}, {"id":"1847.0", "code":"090425", "name":"Banex Microfinance Bank"}, {"id":"998.0", "code":"090426", "name":"Tangerine Bank"}, {"id":"1846.0", "code":"090427", "name":"Ebsu Microfinance Bank"}, {"id":"1845.0", "code":"090428", "name":"Ishie  Microfinance Bank"}, {"id":"1844.0", "code":"090429", "name":"Crossriver  Microfinance Bank"}, {"id":"1843.0", "code":"090430", "name":"Ilora Microfinance Bank"}, {"id":"1842.0", "code":"090431", "name":"Bluewhales  Microfinance Bank"}, {"id":"1841.0", "code":"090432", "name":"Memphis Microfinance Bank"}, {"id":"1840.0", "code":"090433", "name":"Rigo Microfinance Bank"}, {"id":"1839.0", "code":"090434", "name":"Insight Microfinance Bank"}, {"id":"1353.0", "code":"090435", "name":"Links Microfinance Bank"}, {"id":"1838.0", "code":"090436", "name":"Spectrum Microfinance Bank"}, {"id":"1837.0", "code":"090437", "name":"Oakland Microfinance Bank"}, {"id":"1836.0", "code":"090438", "name":"Futminna Microfinance Bank"}, {"id":"1835.0", "code":"090439", "name":"Ibeto  Microfinance Bank"}, {"id":"1834.0", "code":"090440", "name":"Cherish Microfinance Bank"}, {"id":"1833.0", "code":"090441", "name":"Giwa Microfinance Bank"}, {"id":"1832.0", "code":"090443", "name":"Rima Microfinance Bank"}, {"id":"1831.0", "code":"090444", "name":"Boi Mf Bank"}, {"id":"1830.0", "code":"090445", "name":"Capstone Mf Bank"}, {"id":"1829.0", "code":"090446", "name":"Support Mf Bank"}, {"id":"1828.0", "code":"090448", "name":"Moyofade Mf Bank"}, {"id":"1827.0", "code":"090449", "name":"REX MICROFINANCE BANK"}, {"id":"1826.0", "code":"090450", "name":"Kwasu Mf Bank"}, {"id":"1825.0", "code":"090451", "name":"Atbu  Microfinance Bank"}, {"id":"1824.0", "code":"090452", "name":"Unilag  Microfinance Bank"}, {"id":"1823.0", "code":"090453", "name":"Uzondu Mf Bank"}, {"id":"1822.0", "code":"090454", "name":"Borstal Microfinance Bank"}, {"id":"2045.0", "code":"090455", "name":"MKOBO MICROFINANCE BANK LTD"}, {"id":"1821.0", "code":"090456", "name":"Ospoly Microfinance Bank"}, {"id":"1820.0", "code":"090459", "name":"Nice Microfinance Bank"}, {"id":"1819.0", "code":"090460", "name":"Oluyole Microfinance Bank"}, {"id":"1818.0", "code":"090461", "name":"Uniibadan Microfinance Bank"}, {"id":"1817.0", "code":"090462", "name":"Monarch Microfinance Bank"}, {"id":"1816.0", "code":"090463", "name":"Rehoboth Microfinance Bank"}, {"id":"1815.0", "code":"090464", "name":"Unimaid Microfinance Bank"}, {"id":"1814.0", "code":"090465", "name":"Maintrust Microfinance Bank"}, {"id":"1813.0", "code":"090466", "name":"Yct Microfinance Bank"}, {"id":"1812.0", "code":"090467", "name":"Good Neighbours Microfinance Bank"}, {"id":"1811.0", "code":"090468", "name":"Olofin Owena Microfinance Bank"}, {"id":"1810.0", "code":"090469", "name":"Aniocha Microfinance Bank"}, {"id":"1317.0", "code":"090470", "name":"DOT MICROFINANCE BANK"}, {"id":"1809.0", "code":"090471", "name":"Oluchukwu Microfinance Bank"}, {"id":"1808.0", "code":"090472", "name":"Caretaker Microfinance Bank"}, {"id":"1807.0", "code":"090473", "name":"Assets Microfinance Bank"}, {"id":"1806.0", "code":"090474", "name":"Verdant Microfinance Bank"}, {"id":"1805.0", "code":"090475", "name":"Giant Stride Microfinance Bank"}, {"id":"1804.0", "code":"090476", "name":"Anchorage Microfinance Bank"}, {"id":"1803.0", "code":"090477", "name":"Light Microfinance Bank"}, {"id":"1802.0", "code":"090478", "name":"Avuenegbe Microfinance Bank"}, {"id":"1801.0", "code":"090479", "name":"First Heritage Microfinance Bank"}, {"id":"1800.0", "code":"090480", "name":"KOLOMONI MICROFINANCE BANK"}, {"id":"1799.0", "code":"090481", "name":"Prisco  Microfinance Bank"}, {"id":"1154.0", "code":"090482", "name":"CLEARPAY MICROFINANCE BANK"}, {"id":"1798.0", "code":"090483", "name":"Ada Microfinance Bank"}, {"id":"1797.0", "code":"090484", "name":"Garki Microfinance Bank"}, {"id":"1796.0", "code":"090485", "name":"Safegate Microfinance Bank"}, {"id":"1795.0", "code":"090486", "name":"Fortress Microfinance Bank"}, {"id":"1794.0", "code":"090487", "name":"Kingdom College  Microfinance Bank"}, {"id":"1793.0", "code":"090488", "name":"Ibu-Aje Micro"}
];

const banksList = BANKS_DATA.map(b => b.name);

const BANK_CODES_MAP: Record<string, string> = {};
BANKS_DATA.forEach(b => {
  BANK_CODES_MAP[b.name] = b.code;
});

const SendMoney: React.FC<SendMoneyProps> = ({ user, onTransfer, onSubscribeRedirect, onGoHome, onRequestFreeWithdrawal }) => {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [bank, setBank] = useState('');
  const [bankSearch, setBankSearch] = useState('');
  const [isBankDropdownOpen, setIsBankDropdownOpen] = useState(false);
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSubscribePopup, setShowSubscribePopup] = useState(false);

  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [lastVerifiedKey, setLastVerifiedKey] = useState('');

  useEffect(() => {
    const bankCode = BANK_CODES_MAP[bank];
    if (!bankCode || accountNumber.length !== 10) {
      if (accountNumber.length < 10) {
        setAccountName('');
        setVerificationError('');
      }
      return;
    }

    const currentKey = `${bankCode}_${accountNumber}`;
    if (currentKey === lastVerifiedKey) {
      return; // Already verified this combination
    }

    if (isVerifying) {
      return; // Prevent concurrent requests
    }

    let isMounted = true;

    const verifyAccount = async () => {
      setIsVerifying(true);
      setVerificationError('');
      setAccountName('');
      try {
        const response = await fetch('/api/verify-account', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            accountNumber,
            bankCode,
          }),
        });

        if (!response.ok) {
          throw new Error('Verification network request failed');
        }

        const data = await response.json();
        if (isMounted) {
          if (data.success) {
            setAccountName(data.accountName);
            setLastVerifiedKey(currentKey);
            setVerificationError('');
          } else {
            setVerificationError(data.error || 'Failed to verify account details');
            setAccountName('');
          }
        }
      } catch (err: any) {
        console.error('Account verification request error:', err);
        if (isMounted) {
          setVerificationError('Network error during account verification. Please try again.');
          setAccountName('');
        }
      } finally {
        if (isMounted) {
          setIsVerifying(false);
        }
      }
    };

    verifyAccount();

    return () => {
      isMounted = false;
    };
  }, [bank, accountNumber, lastVerifiedKey]);

  // Calculate deactivation state dynamically
  const isDeactivated = user.deactivationDate && Date.now() > user.deactivationDate;

  const checkWithdrawalLimit = (transferAmount: number): string | null => {
    if (!user.subscriptionPlan) return "Subscription required";

    let limit = 0;
    let periodMs = 0;
    let planName = user.subscriptionPlan;

    if (planName === 'Weekly Plan' || planName === 'Weekly Saver') {
        limit = user.customWeeklyLimit ?? 500000;
        periodMs = 7 * 24 * 60 * 60 * 1000; // 7 days
    } else if (planName === '3 Months Plan' || planName === 'Quarterly Plan' || planName === '3 Months Saver') {
        limit = 800000;
        periodMs = 90 * 24 * 60 * 60 * 1000; // 90 days
    } else if (planName === 'Monthly Plan' || planName === 'Monthly Pro') {
        limit = user.customMonthlyLimit ?? 2000000;
        periodMs = 30 * 24 * 60 * 60 * 1000; // 30 days
    } else if (planName === 'Yearly Plan' || planName === 'Premium Elite') {
        return null; // Unlimited
    } else if (planName === 'Promo Subscription') {
        const hasDebit = (user.transactions || []).some(t => {
            const isUxTradeFunding = t.id?.startsWith('trx-trade-fund-') || t.description?.toLowerCase().includes('ux-trade') || t.description?.toLowerCase().includes('funded ux-trade');
            return t.type === 'debit' && !isUxTradeFunding && t.status === 'success';
        });
        if (hasDebit) {
            return "This promo subscription only allows a single (once) withdrawal. Your authorized withdrawal limit has already been used.";
        }
        return null; // Unlimited for that single withdrawal!
    } else {
        return null;
    }

    const now = Date.now();
    const startTime = now - periodMs;
    
    const recentWithdrawals = (user.transactions || [])
        .filter(t => {
            const isUxTradeFunding = t.id?.startsWith('trx-trade-fund-') || t.description?.toLowerCase().includes('ux-trade') || t.description?.toLowerCase().includes('funded ux-trade');
            return t.type === 'debit' && !isUxTradeFunding && new Date(t.date).getTime() > startTime;
        })
        .reduce((sum, t) => sum + t.amount, 0);

    if (recentWithdrawals + transferAmount > limit) {
        return `Limit exceeded. You have used ₦${recentWithdrawals.toLocaleString()} of your ₦${limit.toLocaleString()} limit for this period.`;
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isDeactivated) {
        setError("Account is deactivated");
        return;
    }

    if (!accountName || accountName.trim().length === 0) {
        setError("Please enter a valid account name.");
        return;
    }

    const transferAmount = parseFloat(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
        setError("Please enter a valid amount");
        return;
    }

    if (transferAmount > user.balance) {
        setError("Insufficient funds");
        return;
    }

    if (!user.isSubscribed) {
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            setShowSubscribePopup(true);
        }, 5000);
        return;
    }

    const limitError = checkWithdrawalLimit(transferAmount);
    if (limitError) {
        setError(limitError);
        return;
    }

    setIsLoading(true);

    try {
        // Save the withdrawal request doc as specified by customer
        const withdrawalDoc = {
          userId: user.email,
          bankName: bank,
          accountNumber: accountNumber,
          accountName: accountName,
          amount: transferAmount,
          timestamp: new Date().toISOString(),
          status: "pending"
        };
        await addDoc(collection(db, 'withdrawals'), withdrawalDoc);
        console.log("Withdrawal transaction successfully written to Firestore:", withdrawalDoc);

        // Execute local transfer balance update
        onTransfer(transferAmount, `Withdraw to ${bank} - ${accountName}`);
        setIsLoading(false);
        setStep('success');
    } catch (fsError: any) {
        console.error("Firestore submission error:", fsError);
        setError("A database error occurred. Please verify your connection.");
        setIsLoading(false);
    }
  };

  if (isDeactivated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-amber-100/40 text-amber-950 font-sans p-4 sm:p-6 pb-24">
        <div className="max-w-md mx-auto space-y-5 animate-in fade-in duration-300">
          <div className="bg-white border-2 border-red-300 rounded-3xl p-6 shadow-xl text-center space-y-5">
            <div className="w-16 h-16 bg-red-100 border-2 border-red-300 rounded-full flex items-center justify-center mx-auto text-red-600 shadow-md">
              <Ban size={36} />
            </div>
            <div>
              <h2 className="text-xl font-black text-amber-950 uppercase tracking-tight mb-2">Withdrawal Restricted</h2>
              <div className="bg-red-50 p-4 rounded-2xl border border-red-200">
                <p className="text-red-700 font-bold text-xs leading-relaxed">
                  User must pay 20,000 naira to activate account, using a POS.
                </p>
              </div>
            </div>
            <button 
              onClick={() => onGoHome(false)}
              className="w-full py-3.5 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-black font-extrabold rounded-2xl shadow-lg transition-all active:scale-95 uppercase tracking-wider text-xs"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-amber-100/40 text-amber-950 font-sans p-4 sm:p-6 pb-24">
        <div className="max-w-md mx-auto space-y-5 animate-in fade-in duration-300">
          <div className="bg-white border-2 border-emerald-400 rounded-3xl p-6 shadow-xl shadow-amber-200/60 text-center space-y-5 relative overflow-hidden">
            <div className="w-16 h-16 bg-emerald-100 border-2 border-emerald-400 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-inner">
              <Check size={36} />
            </div>
            <div>
              <h2 className="text-xl font-black text-amber-950 uppercase tracking-tight mb-1">Withdrawal Successful!</h2>
              <p className="text-xs text-amber-800 font-medium leading-relaxed">
                You successfully withdrew <span className="font-extrabold text-amber-950">₦{parseFloat(amount).toLocaleString()}</span> to {accountName}.
              </p>
            </div>

            {user.transactions?.some(t => t.type === 'debit' && t.status === 'pending') && (
              <div className="bg-amber-50 border-2 border-amber-300 p-4 rounded-2xl text-left flex items-start space-x-3 text-amber-950">
                <Icons.Upgrade size={24} className="shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <h3 className="font-black text-xs uppercase tracking-wider text-amber-950">Transaction Pending</h3>
                  <p className="text-[11px] mt-1 font-semibold leading-relaxed text-amber-900">Upgrade to VIP to remove your transaction on pending so your alerts drop immediately.</p>
                </div>
              </div>
            )}

            <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200 space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-amber-200">
                <span className="text-amber-800 font-bold">Bank</span>
                <span className="font-extrabold text-amber-950">{bank}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-amber-200">
                <span className="text-amber-800 font-bold">Account</span>
                <span className="font-extrabold text-amber-950">{accountNumber}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-amber-800 font-bold">Transaction ID</span>
                <span className="font-mono font-bold text-amber-950">TRX-{Math.floor(Math.random() * 100000000)}</span>
              </div>
            </div>

            <button 
              onClick={() => onGoHome(false)}
              className="w-full py-3.5 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-black font-extrabold rounded-2xl shadow-lg shadow-amber-300/50 transition-all active:scale-95 uppercase tracking-wider text-xs"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-amber-100/40 text-amber-950 font-sans p-4 sm:p-6 pb-24">
      <div className="max-w-md mx-auto space-y-5 animate-in fade-in duration-300">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between bg-white border-2 border-amber-300/80 rounded-2xl p-4 shadow-md shadow-amber-200/50">
          <button
            type="button"
            onClick={() => onGoHome(false)}
            className="w-10 h-10 rounded-full bg-amber-100 hover:bg-amber-200 border border-amber-300 flex items-center justify-center text-amber-900 transition-all active:scale-95"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="text-center">
            <h1 className="text-lg font-black text-amber-950 uppercase tracking-tight">
              Withdraw to Bank
            </h1>
            <p className="text-[10px] font-bold text-amber-700 tracking-wider uppercase font-mono">
              Chix9ja Bank Transfer
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-400/20 border border-amber-300 flex items-center justify-center text-amber-700">
            <ShieldCheck size={20} />
          </div>
        </div>

        {/* Available Balance Card */}
        <div className="bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 rounded-2xl p-5 text-black shadow-lg shadow-amber-300/50 border border-amber-300 relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-white/20 rounded-full blur-xl pointer-events-none"></div>
          <div className="relative z-10 flex justify-between items-center">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-widest text-amber-950/80">
                Available Balance
              </p>
              <h2 className="text-2xl sm:text-3xl font-black text-black tracking-tight mt-1">
                ₦{(user.balance || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
              </h2>
              {user.subscriptionPlan && (
                <span className="inline-block mt-2 px-2.5 py-0.5 bg-black/10 text-black rounded-full text-[10px] font-extrabold uppercase tracking-wider border border-black/10">
                  Plan: {user.subscriptionPlan}
                </span>
              )}
            </div>
            <div className="bg-black/10 backdrop-blur-sm p-3 rounded-2xl border border-black/10">
              <Wallet size={28} className="text-black" />
            </div>
          </div>
        </div>

        {/* Withdrawal Form Card */}
        <div className="bg-white border-2 border-amber-300/80 rounded-3xl p-5 shadow-md shadow-amber-200/40 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-300 text-red-700 text-xs font-bold p-3.5 rounded-2xl flex items-center space-x-2">
                <AlertCircle size={18} className="text-red-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="text-xs font-black uppercase tracking-wider text-amber-950 flex items-center gap-1.5 mb-1.5">
                <Building size={16} className="text-amber-600" />
                Select Destination Bank
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={bankSearch}
                  onChange={(e) => {
                    setBankSearch(e.target.value);
                    setIsBankDropdownOpen(true);
                    if (e.target.value !== bank) {
                      setBank('');
                    }
                  }}
                  onFocus={() => setIsBankDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setIsBankDropdownOpen(false), 200)}
                  placeholder="Search bank (e.g. Access, OPay, GTBank)"
                  required
                  className="w-full p-3.5 bg-amber-50/50 border-2 border-amber-300 rounded-2xl text-amber-950 placeholder-amber-900/40 outline-none focus:border-amber-500 focus:bg-white font-medium text-sm transition-all"
                />
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                  {bank ? (
                    <span className="text-[10px] font-extrabold text-amber-900 bg-amber-200 px-2.5 py-1 rounded-full border border-amber-400 uppercase tracking-wider">
                      Selected
                    </span>
                  ) : (
                    <Icons.ChevronRight className="text-amber-500 rotate-90" size={18} />
                  )}
                </div>

                {isBankDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1.5 max-h-60 overflow-y-auto bg-white border-2 border-amber-300 rounded-2xl shadow-xl divide-y divide-amber-100 animate-in fade-in slide-in-from-top-1 duration-100">
                    {(() => {
                      const filtered = bankSearch.trim() === ''
                        ? BANKS_DATA
                        : BANKS_DATA.filter(b => b.name.toLowerCase().includes(bankSearch.toLowerCase()));
                      
                      return filtered.length > 0 ? (
                        filtered.slice(0, 15).map((b) => (
                          <button
                            key={b.code}
                            type="button"
                            onClick={() => {
                              setBank(b.name);
                              setBankSearch(b.name);
                              setIsBankDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-3 text-sm text-amber-950 hover:bg-amber-100/60 font-medium transition-colors flex items-center justify-between"
                          >
                            <span className="font-semibold">{b.name}</span>
                            <span className="text-[10px] text-amber-800/60 font-mono">{b.code}</span>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-sm text-amber-800/70 italic text-center">
                          No banks found
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="text-xs font-black uppercase tracking-wider text-amber-950 flex items-center gap-1.5 mb-1.5">
                <Coins size={16} className="text-amber-600" />
                Account Number
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={10}
                value={accountNumber}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/[^0-9]/g, '');
                  if (cleaned.length <= 10) {
                    setAccountNumber(cleaned);
                  }
                }}
                placeholder="0123456789"
                required
                className="w-full p-3.5 bg-amber-50/50 border-2 border-amber-300 rounded-2xl text-amber-950 placeholder-amber-900/40 outline-none focus:border-amber-500 focus:bg-white font-mono text-lg font-bold tracking-wider transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-black uppercase tracking-wider text-amber-950 flex items-center gap-1.5 mb-1.5">
                <UserIcon size={16} className="text-amber-600" />
                Account Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  value={accountName}
                  placeholder={isVerifying ? "Verifying account details..." : "Account Name (automatically verified)"}
                  required
                  className={`w-full p-3.5 bg-amber-50/50 border-2 rounded-2xl text-amber-950 font-bold outline-none transition-all ${
                    isVerifying 
                      ? 'border-amber-400 text-amber-700 bg-amber-100/40' 
                      : accountName 
                      ? 'border-emerald-500 text-emerald-900 bg-emerald-50/60' 
                      : 'border-amber-300 text-amber-950'
                  }`}
                />
                {isVerifying && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <RefreshCw size={18} className="animate-spin text-amber-600" />
                  </div>
                )}
              </div>
              {verificationError && (
                <p className="text-xs text-red-600 font-bold mt-1.5 pl-1 flex items-center gap-1">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{verificationError}</span>
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-black uppercase tracking-wider text-amber-950 flex items-center gap-1.5 mb-1.5">
                <Coins size={16} className="text-amber-600" />
                Withdrawal Amount (₦)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3.5 text-amber-800 font-black">₦</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  className="w-full p-3.5 pl-10 bg-amber-50/50 border-2 border-amber-300 rounded-2xl text-xl font-black text-amber-950 placeholder-amber-900/40 outline-none focus:border-amber-500 focus:bg-white transition-all"
                />
              </div>
              <div className="flex justify-between items-center mt-1.5">
                {user.isSubscribed && (
                  <div className="flex items-center text-amber-900 bg-amber-300 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter border border-amber-500 shadow-sm animate-bounce">
                    <Star size={10} className="mr-1 fill-amber-900" /> Golden Member
                  </div>
                )}
                <p className="text-xs font-bold text-amber-800 text-right flex-1">
                  Balance: ₦{(user.balance || 0).toLocaleString()}
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || isVerifying || !bank || !accountNumber || accountNumber.length !== 10 || !accountName || !amount}
              className="w-full py-4 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed text-black font-extrabold rounded-2xl shadow-xl shadow-amber-300/60 transition-all active:scale-95 uppercase tracking-wider text-xs flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw size={18} className="animate-spin text-black" />
                  <span>Processing Withdrawal...</span>
                </>
              ) : (
                <>
                  <span>Withdraw Money</span>
                  <ArrowUpRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Subscription Popup */}
        {showSubscribePopup && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white border-2 border-amber-400 rounded-3xl p-6 w-full max-w-sm text-center space-y-5 shadow-2xl relative overflow-hidden">
              <div className="w-16 h-16 bg-amber-100 border-2 border-amber-300 rounded-full flex items-center justify-center mx-auto text-amber-600 shadow-md animate-bounce">
                <Star size={34} className="fill-amber-500" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-black text-amber-950 uppercase tracking-tight">
                  Subscription Required
                </h3>
                <p className="text-xs text-amber-800 font-medium leading-relaxed">
                  Kindly subscribe to access fast withdrawal.
                </p>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowSubscribePopup(false);
                    onSubscribeRedirect();
                  }}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-black font-extrabold rounded-2xl shadow-lg shadow-amber-300/50 transition-all active:scale-95 uppercase tracking-wider text-xs"
                >
                  Go to Subscription
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSubscribePopup(false);
                    onGoHome(true);
                  }}
                  className="w-full py-3 bg-amber-50 border border-amber-300 text-amber-900 font-bold rounded-2xl hover:bg-amber-100 transition-all text-xs uppercase"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default SendMoney;
