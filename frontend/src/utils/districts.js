const rawDistrictsText = `Frisco ISD - hac.friscoisd.org
McKinney ISD - hac.mckinneyisd.net
Round Rock ISD - accesscenter.roundrockisd.org
Irving ISD - esphac.irvingisd.net
Leander ISD - lis-hac.eschoolplus.powerschool.com
Tomball ISD - grades.tomballisd.net
Northside ISD - hac.nisd.net
Cypress Fairbanks ISD - home-access.cfisd.net
Katy ISD - homeaccess.katyisd.org
Denton ISD - denhac.dentonisd.org
Coppell ISD - hac.coppellisd.com
Killeen ISD - esphac.killeenisd.org
Aldine ISD - hac.aldineisd.org
HEB ISD - homeaccess.hebisd.edu
Central Dauphin Schools - hac.cdschools.org
Akron Public Schools - homeaccess.akron.k12.oh.us
East Meadow SD - homeaccess.emufsd.us
San Angelo ISD - homeaccess.saisd.org
Parma City SD - homeaccess.parmacityschools.org
St. Mary's County Public Schools - hac.smcps.org
Chula Vista Elementary SD - homeaccesscenter.cvesd.org
Hinsdale Central - portal.hinsdale86.org
Harford County Public Schools - hac.hcps.org
Midway ISD - hac.midwayisd.org
Lakota Local SD - hac.lakotainline.com
Carroll County Public Schools - mystudent.carrollk12.org
Tamalpais Union High SD - home.tamdistrict.org
St. Johns County SD - homeaccess.stjohns.k12.fl.us
Tacoma Public Schools - espha.tacoma.k12.wa.us
Community High SD 99 - hac.csd99.org
St. Charles District 303 - istudent.d303.org
Geneva CUSD - eschoolhac.geneva304.org
Neshaminy SD - hac.neshaminy.org
Dayton Public School - hac4.dps.k12.oh.us
Plainfield SD - esp-has-1.psd202.org
Brownsville ISD - hac.bisd.us
State College ASD - homeaccess.scasd.org
Alief ISD - aliefhac1.aliefisd.net
College Station ISD - hac.csisd.org
Los Fresnos Consolidated ISD - eschoolhac.lfcisd.net
Humble ISD - eshac.humbleisd.net
Ysleta ISD - hac2.yisd.net
Kingsville ISD - hac.kingsvilleisd.com
Mount Pleasant ISD - hac.mpisd.net
Everett Public Schools - hac.everett.k12.wa.us
Alum Rock USD - hac.arusd.org
Interboro SD - hac.interborosd.org
Harlingen Consolidated ISD - harhac.hcisd.org
Corpus Christi ISD - hac.ccisd.us
Calvert County Public Schools - hac.calvertnet.k12.md.us
Centerville City SD - hac.centerville.k12.oh.us
Rockford Public Schools District 205 - hac.rps205.com
Suffolk Public Schools - hac.spsk12.net
Northwest ISD - hac.nisdtx.org
Champaign Unit 4 SD - hac.champaignschools.org
Mastery Charter School - hacnj.masterycharter.org
Victoria ISD - visdgrades.visd.net
Hilliard City Schools - homeaccess.hboe.org
Spring ISD - hac4.springisd.org
Bryan ISD - hac.bryanisd.org
LaSalle-Peru Township High School District 120 - ehome.lphs.org
Evanston Township High School District 202 - hac.eths.k12.il.us
Leyden Community High School District 212 - hac.leyden212.org
LaPorte ISD - hac.lpisd.org
Pharr-San Juan-Alamo Independent School District - homeaccess.psjaisd.us
Lake Park High School District 108 - ehome.lphs.org
Bethel Park SD - bpk-hac.eschoolplus.powerschool.com
San Marcos Consolidated ISD - homeaccess.smcisd.net
Conroe ISD - hac.conroeisd.net
Cleveland ISD - eshac.ctxisd.org
Irvington UFSD - hac.lhric.org
Eastchester - hac.lhric.org
Lakeland CSD - hac.lhric.org
MtVernonCSD - hac.lhric.org
Nanuet UFSD - hac.lhric.org
New Rochelle CSD - hac.lhric.org
Port Chester UFSD - hac.lhric.org
GreenburghCSD - hac.lhric.org
Greenburgh11 - hac.lhric.org
GreenburghNorthCastleUFSD - hac.lhric.org
Hawthorne Cedar Knolls UFSD - hac.lhric.org
Alamo Heights Live - esp41pwhac.eschoolplus.powerschool.com
Bethel SD Live - esp41pwhac.eschoolplus.powerschool.com
Buckeye Union SD Live - esp41pwhac.eschoolplus.powerschool.com
Cleveland ISD Live - esp41pwhac.eschoolplus.powerschool.com
Denison ISD Live - esp41pwhac.eschoolplus.powerschool.com
Granada Hills Charter SD - esp41pwhac.eschoolplus.powerschool.com
Hood River County SD Live - esp41pwhac.eschoolplus.powerschool.com
Huntsville ISD Live - esp41pwhac.eschoolplus.powerschool.com
Melissa ISD Live - esp41pwhac.eschoolplus.powerschool.com
Nacogdoches ISD Live - esp41pwhac.eschoolplus.powerschool.com
Nederland ISD Live - esp41pwhac.eschoolplus.powerschool.com
Texans Can Academies Live - esp41pwhac.eschoolplus.powerschool.com
Tuloso-Midway ISD Live - esp41pwhac.eschoolplus.powerschool.com
Vanguard Academy Live - esp41pwhac.eschoolplus.powerschool.com
Blachly Live - wil41hac.eschoolplus.powerschool.com
Creswell Live - wil41hac.eschoolplus.powerschool.com
Crow-Applegate Live - wil41hac.eschoolplus.powerschool.com
Dallas Live - wil41hac.eschoolplus.powerschool.com
Dayton SD Live - wil41hac.eschoolplus.powerschool.com
Fern Ridge Live - wil41hac.eschoolplus.powerschool.com
Junction City Live - wil41hac.eschoolplus.powerschool.com
Klamath Live - wil41hac.eschoolplus.powerschool.com
Lane ESD Live - wil41hac.eschoolplus.powerschool.com
Lowell Live - wil41hac.eschoolplus.powerschool.com
Mapleton Live - wil41hac.eschoolplus.powerschool.com
Mckenzie Live - wil41hac.eschoolplus.powerschool.com
McMinnville Live - wil41hac.eschoolplus.powerschool.com
Muslim Eductional Trust Live - wil41hac.eschoolplus.powerschool.com
North Wasco Live - wil41hac.eschoolplus.powerschool.com
Oakridge Live - wil41hac.eschoolplus.powerschool.com
Pendleton Live - wil41hac.eschoolplus.powerschool.com
Perrydale Live - wil41hac.eschoolplus.powerschool.com
Sheridan Live - wil41hac.eschoolplus.powerschool.com
South Lane Live - wil41hac.eschoolplus.powerschool.com
St. Paul Live - wil41hac.eschoolplus.powerschool.com
Ukiah Live - wil41hac.eschoolplus.powerschool.com
WESD EI/ECSE Live - wil41hac.eschoolplus.powerschool.com
Willamette Career Academy Live - wil41hac.eschoolplus.powerschool.com
Willamette ESD Template41 - wil41hac.eschoolplus.powerschool.com
Willamina Live - wil41hac.eschoolplus.powerschool.com
Belvidere Community Unit School Dist#100 - esp41pehac.eschoolplus.powerschool.com
Brookville ASD Live - esp41pehac.eschoolplus.powerschool.com
Carmel Live - esp41pehac.eschoolplus.powerschool.com
CSMI-Atlantic City Charter Live - esp41pehac.eschoolplus.powerschool.com
CSMI-Camden Charter Live - esp41pehac.eschoolplus.powerschool.com
CSMI-Chester Community Charter Live - esp41pehac.eschoolplus.powerschool.com
Conneaut SD Live - esp41pehac.eschoolplus.powerschool.com
Coatesville Area SD Live - esp41pehac.eschoolplus.powerschool.com
Council Rock SD - esp41pehac.eschoolplus.powerschool.com
Chester Upland SD Live - esp41pehac.eschoolplus.powerschool.com
Franklin Regional Live - esp41pehac.eschoolplus.powerschool.com
Greater Latrobe SD Live - esp41pehac.eschoolplus.powerschool.com
Hudson City Schools - esp41pehac.eschoolplus.powerschool.com
Jefferson County Dubois Live - esp41pehac.eschoolplus.powerschool.com
Lower Moreland Live - esp41pehac.eschoolplus.powerschool.com
Parkland SD Live - esp41pehac.eschoolplus.powerschool.com
Pennsbury SD Live - esp41pehac.eschoolplus.powerschool.com
Pottstown Live - esp41pehac.eschoolplus.powerschool.com
Radnor Township SD Live - esp41pehac.eschoolplus.powerschool.com
Riverview SD - esp41pehac.eschoolplus.powerschool.com
Rose Tree Live - esp41pehac.eschoolplus.powerschool.com
Scranton City SD Live - esp41pehac.eschoolplus.powerschool.com
Souderton Area SD - esp41pehac.eschoolplus.powerschool.com
Springfield Township Live - esp41pehac.eschoolplus.powerschool.com
Speed SEJA SD #802 Live - esp41pehac.eschoolplus.powerschool.com
Springfield SD Live - esp41pehac.eschoolplus.powerschool.com
Toledo SD Live - esp41pehac.eschoolplus.powerschool.com
Upper Moreland Township SD - esp41pehac.eschoolplus.powerschool.com
Upper Darby SD - esp41pehac.eschoolplus.powerschool.com
Union Area SD Live - esp41pehac.eschoolplus.powerschool.com
West Chicago ESD #33 Live - esp41pehac.eschoolplus.powerschool.com
Windham Public Schools - esp41pehac.eschoolplus.powerschool.com
William Penn SD Live - esp41pehac.eschoolplus.powerschool.com
Yonkers Public Schools Live - esp41pehac.eschoolplus.powerschool.com
Current School Year 26_27 - hac40.pps.k12.pa.us
Previous School Year 25_26 - hac40.pps.k12.pa.us
Alliance City - hac.sparcc.org
Brown Local - hac.sparcc.org
Canton City SD - hac.sparcc.org
Canton Local - hac.sparcc.org
Crestwood Local - hac.sparcc.org
Fairless Local - hac.sparcc.org
Field Local - hac.sparcc.org
Jackson Local - hac.sparcc.org
Lake Local - hac.sparcc.org
Louisville City - hac.sparcc.org
Marlington Local - hac.sparcc.org
Mason City Schools - hac.sparcc.org
Massillon City - hac.sparcc.org
Massillon Digital - hac.sparcc.org
Minerva Local - hac.sparcc.org
North Canton - hac.sparcc.org
Northwest Local - hac.sparcc.org
Perry Local - hac.sparcc.org
Plain Local - hac.sparcc.org
R.G. Drage Career Ed - hac.sparcc.org
Ravenna - hac.sparcc.org
Sandy Valley Local - hac.sparcc.org
Stark County ESC - hac.sparcc.org
STRASBURG-FRANKLIN LOCAL SD - hac.sparcc.org
Streetsboro City - hac.sparcc.org
Tuslaw Local - hac.sparcc.org
Windham Exempted Village - hac.sparcc.org
Academics Plus Charter - hac23.esp.k12.ar.us
Academies of Math &amp; Science - hac23.esp.k12.ar.us
Alma SD - hac23.esp.k12.ar.us
Alpena School district - hac23.esp.k12.ar.us
Arch Ford Education Service Cooperative - hac23.esp.k12.ar.us
Arkadelphia SD - hac23.esp.k12.ar.us
Arkansas Arts Academy - hac23.esp.k12.ar.us
Arkansas Connections Academy - hac23.esp.k12.ar.us
Arkansas Executive Prep Harrison - hac23.esp.k12.ar.us
Arkansas Lighthouse Charter Schools - hac23.esp.k12.ar.us
Arkansas Outdoor Academy - hac23.esp.k12.ar.us
Arkansas River Education Service Cooperative - hac23.esp.k12.ar.us
Arkansas School for the Deaf and Blind - hac23.esp.k12.ar.us
Arkansas Virtual Academy - hac23.esp.k12.ar.us
Armorel SD - hac23.esp.k12.ar.us
Ashdown SD - hac23.esp.k12.ar.us
Atkins SD - hac23.esp.k12.ar.us
Augusta SD - hac23.esp.k12.ar.us
Bald Knob SD - hac23.esp.k12.ar.us
Barton SD - hac23.esp.k12.ar.us
Batesville SD - hac23.esp.k12.ar.us
Bauxite SD - hac23.esp.k12.ar.us
Bay SD - hac23.esp.k12.ar.us
Bearden SD - hac23.esp.k12.ar.us
Beebe SD - hac23.esp.k12.ar.us
Benton SD - hac23.esp.k12.ar.us
Bentonville SD - hac23.esp.k12.ar.us
Bergman SD - hac23.esp.k12.ar.us
Berryville SD - hac23.esp.k12.ar.us
Bismarck SD - hac23.esp.k12.ar.us
Blevins SD - hac23.esp.k12.ar.us
Blytheville SD - hac23.esp.k12.ar.us
Booneville SD - hac23.esp.k12.ar.us
Bradford SD - hac23.esp.k12.ar.us
Brinkley SD - hac23.esp.k12.ar.us
Brookland SD - hac23.esp.k12.ar.us
Bryant SD - hac23.esp.k12.ar.us
Buffalo Island Central SD - hac23.esp.k12.ar.us
Cabot SD - hac23.esp.k12.ar.us
Caddo Hills SD - hac23.esp.k12.ar.us
Calico Rock SD - hac23.esp.k12.ar.us
Camden Fairview SD - hac23.esp.k12.ar.us
Carlisle SD - hac23.esp.k12.ar.us
Cave City SD - hac23.esp.k12.ar.us
Cedar Ridge SD - hac23.esp.k12.ar.us
Cedarville SD - hac23.esp.k12.ar.us
Centerpoint SD - hac23.esp.k12.ar.us
Charleston SD - hac23.esp.k12.ar.us
CIVICA Career and Collegiate Academy Bentonville - hac23.esp.k12.ar.us
Clarendon SD - hac23.esp.k12.ar.us
Clarksville SD - hac23.esp.k12.ar.us
Cleveland County SD - hac23.esp.k12.ar.us
Clinton SD - hac23.esp.k12.ar.us
College Preparatory Academies of Arkansas - hac23.esp.k12.ar.us
Concord SD - hac23.esp.k12.ar.us
Conway SD - hac23.esp.k12.ar.us
Corning SD - hac23.esp.k12.ar.us
Cossatot River SD - hac23.esp.k12.ar.us
Cotter SD - hac23.esp.k12.ar.us
County Line SD - hac23.esp.k12.ar.us
Cross County SD - hac23.esp.k12.ar.us
Crossett SD - hac23.esp.k12.ar.us
Crowley's Ridge Education Service Cooperative - hac23.esp.k12.ar.us
Cutter Morning Star SD - hac23.esp.k12.ar.us
Danville SD - hac23.esp.k12.ar.us
Dardanelle SD - hac23.esp.k12.ar.us
Dawson Education Service Cooperative - hac23.esp.k12.ar.us
Decatur SD - hac23.esp.k12.ar.us
Deer-Mount Judea SD - hac23.esp.k12.ar.us
Delta Preparatory School - hac23.esp.k12.ar.us
DeQueen SD - hac23.esp.k12.ar.us
Dequeen-Mena Education Service Cooperative - hac23.esp.k12.ar.us
Dermott SD - hac23.esp.k12.ar.us
Des Arc SD - hac23.esp.k12.ar.us
Dewitt SD - hac23.esp.k12.ar.us
Dierks SD - hac23.esp.k12.ar.us
Division of Youth Services - hac23.esp.k12.ar.us
Dover School District - hac23.esp.k12.ar.us
Drew Central SD - hac23.esp.k12.ar.us
Dumas SD - hac23.esp.k12.ar.us
Earle SD - hac23.esp.k12.ar.us
East End SD - hac23.esp.k12.ar.us
East Poinsett County SD - hac23.esp.k12.ar.us
El Dorado SD - hac23.esp.k12.ar.us
Elkins SD - hac23.esp.k12.ar.us
Emerson-Taylor-Bradley SD - hac23.esp.k12.ar.us
England SD - hac23.esp.k12.ar.us
eSTEM Public Charter School - hac23.esp.k12.ar.us
Eureka Springs SD - hac23.esp.k12.ar.us
Exalt Academy of Southwest Little Rock - hac23.esp.k12.ar.us
Farmington SD - hac23.esp.k12.ar.us
Fayetteville SD - hac23.esp.k12.ar.us
Flippin SD - hac23.esp.k12.ar.us
Fordyce SD - hac23.esp.k12.ar.us
Foreman SD - hac23.esp.k12.ar.us
Forrest City SD - hac23.esp.k12.ar.us
Fort Smith SD - hac23.esp.k12.ar.us
Fouke SD - hac23.esp.k12.ar.us
Fountain Lake SD - hac23.esp.k12.ar.us
Friendship Aspire Academies Arkansas - hac23.esp.k12.ar.us
Future School of Fort Smith - hac23.esp.k12.ar.us
Garfield Scholars Academy - hac23.esp.k12.ar.us
Genoa Central SD - hac23.esp.k12.ar.us
Gentry SD - hac23.esp.k12.ar.us
Glen Rose SD - hac23.esp.k12.ar.us
Gosnell SD - hac23.esp.k12.ar.us
Graduate Arkansas - hac23.esp.k12.ar.us
Gravette SD - hac23.esp.k12.ar.us
Great Rivers Education Service Cooperative - hac23.esp.k12.ar.us
Green Forest SD - hac23.esp.k12.ar.us
Greenbrier SD - hac23.esp.k12.ar.us
Greene County Tech SD - hac23.esp.k12.ar.us
Greenland SD - hac23.esp.k12.ar.us
Greenwood SD - hac23.esp.k12.ar.us
Gurdon SD - hac23.esp.k12.ar.us
Guy Fenter Education Service Cooperative - hac23.esp.k12.ar.us
Guy-Perkins SD - hac23.esp.k12.ar.us
Haas Hall Academy - hac23.esp.k12.ar.us
Hackett SD - hac23.esp.k12.ar.us
Hamburg SD - hac23.esp.k12.ar.us
Hampton SD - hac23.esp.k12.ar.us
Harmony Grove (Ouachitia County) SD - hac23.esp.k12.ar.us
Harmony Grove (Saline County) SD - hac23.esp.k12.ar.us
Harrisburg SD - hac23.esp.k12.ar.us
Harrison SD - hac23.esp.k12.ar.us
Hazen SD - hac23.esp.k12.ar.us
Heber Springs SD - hac23.esp.k12.ar.us
Hector SD - hac23.esp.k12.ar.us
Helena-West Helena SD - hac23.esp.k12.ar.us
Hermitage SD - hac23.esp.k12.ar.us
Highland SD - hac23.esp.k12.ar.us
Hillcrest SD - hac23.esp.k12.ar.us
Hope SD - hac23.esp.k12.ar.us
Horatio SD - hac23.esp.k12.ar.us
Hot Springs SD - hac23.esp.k12.ar.us
Hoxie SD - hac23.esp.k12.ar.us
Huntsville SD - hac23.esp.k12.ar.us
ID Management - hac23.esp.k12.ar.us
Imboden Area Charter School - hac23.esp.k12.ar.us
Institute for the Creative Arts - hac23.esp.k12.ar.us
IOTA Community Schools - hac23.esp.k12.ar.us
Izard County Consolidated SD - hac23.esp.k12.ar.us
Jackson County SD - hac23.esp.k12.ar.us
Jacksonville-North Pulaski SD - hac23.esp.k12.ar.us
Jasper SD - hac23.esp.k12.ar.us
Jessieville SD - hac23.esp.k12.ar.us
Jonesboro SD - hac23.esp.k12.ar.us
Junction City SD - hac23.esp.k12.ar.us
Kingston SD - hac23.esp.k12.ar.us
Kirby SD - hac23.esp.k12.ar.us
Lafayette County SD - hac23.esp.k12.ar.us
Lake Hamilton SD - hac23.esp.k12.ar.us
Lakeside (Chicot County) SD - hac23.esp.k12.ar.us
Lakeside (Garland County) SD - hac23.esp.k12.ar.us
Lamar SD - hac23.esp.k12.ar.us
Lavaca SD - hac23.esp.k12.ar.us
Lawrence County SD - hac23.esp.k12.ar.us
Lead Hill SD - hac23.esp.k12.ar.us
Lee County SD - hac23.esp.k12.ar.us
Lincoln Consolidated SD - hac23.esp.k12.ar.us
LISA Academy - hac23.esp.k12.ar.us
Little Rock SD - hac23.esp.k12.ar.us
Lonoke SD - hac23.esp.k12.ar.us
Magazine SD - hac23.esp.k12.ar.us
Magnet Cove SD - hac23.esp.k12.ar.us
Magnolia SD - hac23.esp.k12.ar.us
Malvern SD - hac23.esp.k12.ar.us
Mammoth Spring SD - hac23.esp.k12.ar.us
Manila SD - hac23.esp.k12.ar.us
Mansfield SD - hac23.esp.k12.ar.us
Marion SD - hac23.esp.k12.ar.us
Marked Tree SD - hac23.esp.k12.ar.us
Marmaduke SD - hac23.esp.k12.ar.us
Marvell-Elaine SD - hac23.esp.k12.ar.us
Mayflower SD - hac23.esp.k12.ar.us
Maynard SD - hac23.esp.k12.ar.us
McCrory SD - hac23.esp.k12.ar.us
McGehee SD - hac23.esp.k12.ar.us
Melbourne SD - hac23.esp.k12.ar.us
Mena SD - hac23.esp.k12.ar.us
Midland SD - hac23.esp.k12.ar.us
Mineral Springs SD - hac23.esp.k12.ar.us
Monticello SD - hac23.esp.k12.ar.us
Mount Ida SD - hac23.esp.k12.ar.us
Mountain Home SD - hac23.esp.k12.ar.us
Mountain Pine SD - hac23.esp.k12.ar.us
Mountain View SD - hac23.esp.k12.ar.us
Mountainburg SD - hac23.esp.k12.ar.us
Mt. Vernon/Enola SD - hac23.esp.k12.ar.us
Mulberry-Pleasant View Bi-County SD - hac23.esp.k12.ar.us
Nashville SD - hac23.esp.k12.ar.us
Nemo Vista SD - hac23.esp.k12.ar.us
Nettleton SD - hac23.esp.k12.ar.us
Nevada SD - hac23.esp.k12.ar.us
Newport SD - hac23.esp.k12.ar.us
Norfork SD - hac23.esp.k12.ar.us
North Little Rock SD - hac23.esp.k12.ar.us
Northcentral Arkansas Education Service Coop - hac23.esp.k12.ar.us
Northeast Arkansas Education Cooperative - hac23.esp.k12.ar.us
Northwest Arkansas Education Service Cooperative - hac23.esp.k12.ar.us
Omaha SD - hac23.esp.k12.ar.us
Osceola SD - hac23.esp.k12.ar.us
Ouachita River SD - hac23.esp.k12.ar.us
Ouachita SD - hac23.esp.k12.ar.us
Ozark Mountain SD - hac23.esp.k12.ar.us
Ozark SD - hac23.esp.k12.ar.us
Ozarks Unlimited Resource Service Cooperative - hac23.esp.k12.ar.us
Palestine-Wheatley SD - hac23.esp.k12.ar.us
Pangburn SD - hac23.esp.k12.ar.us
Paragould SD - hac23.esp.k12.ar.us
Paris SD - hac23.esp.k12.ar.us
Parkers Chapel SD - hac23.esp.k12.ar.us
Pea Ridge SD - hac23.esp.k12.ar.us
Perryville SD - hac23.esp.k12.ar.us
Piggott SD - hac23.esp.k12.ar.us
Pine Bluff SD - hac23.esp.k12.ar.us
Pinecrest Academy Roselawn - hac23.esp.k12.ar.us
Pocahontas SD - hac23.esp.k12.ar.us
Pottsville SD - hac23.esp.k12.ar.us
Poyen SD - hac23.esp.k12.ar.us
Prairie Grove SD - hac23.esp.k12.ar.us
Premier High Schools of Arkansas - hac23.esp.k12.ar.us
Prescott SD - hac23.esp.k12.ar.us
Pulaski County Special SD - hac23.esp.k12.ar.us
Quitman SD - hac23.esp.k12.ar.us
Rector SD - hac23.esp.k12.ar.us
Rivercrest SD 57 - hac23.esp.k12.ar.us
Riverside SD - hac23.esp.k12.ar.us
Riverview SD - hac23.esp.k12.ar.us
Rogers SD - hac23.esp.k12.ar.us
Rose Bud SD - hac23.esp.k12.ar.us
Rural Special SD - hac23.esp.k12.ar.us
Russellville SD - hac23.esp.k12.ar.us
Salem SD - hac23.esp.k12.ar.us
ScholarMade Achievement Place of Arkansas - hac23.esp.k12.ar.us
School for Advanced Studies-Northwest Arkansas - hac23.esp.k12.ar.us
Scranton SD - hac23.esp.k12.ar.us
Searcy County SD - hac23.esp.k12.ar.us
Searcy SD - hac23.esp.k12.ar.us
Sheridan SD - hac23.esp.k12.ar.us
Shirley SD - hac23.esp.k12.ar.us
Siloam Springs SD - hac23.esp.k12.ar.us
Sloan-Hendrix SD - hac23.esp.k12.ar.us
Smackover-Norphlet SD - hac23.esp.k12.ar.us
So. Conway County SD - hac23.esp.k12.ar.us
South Central Education Service Cooperative - hac23.esp.k12.ar.us
South Pike County SD - hac23.esp.k12.ar.us
South Side(Bee Branch) SD - hac23.esp.k12.ar.us
Southeast Arkansas Community Based Education Ctr - hac23.esp.k12.ar.us
Southeast Arkansas Education Service Cooperative - hac23.esp.k12.ar.us
Southside SD - hac23.esp.k12.ar.us
Southwest Arkansas Education Cooperative - hac23.esp.k12.ar.us
Spring Hill SD - hac23.esp.k12.ar.us
Springdale SD - hac23.esp.k12.ar.us
Star City SD - hac23.esp.k12.ar.us
Strong-Huttig SD - hac23.esp.k12.ar.us
Stuttgart SD - hac23.esp.k12.ar.us
Success SD - hac23.esp.k12.ar.us
Texarkana SD - hac23.esp.k12.ar.us
Two Rivers SD - hac23.esp.k12.ar.us
Umpire SD - hac23.esp.k12.ar.us
Valley Springs SD - hac23.esp.k12.ar.us
Valley View SD - hac23.esp.k12.ar.us
Van Buren SD - hac23.esp.k12.ar.us
Vilonia SD - hac23.esp.k12.ar.us
Viola SD - hac23.esp.k12.ar.us
Waldron SD - hac23.esp.k12.ar.us
Warren SD - hac23.esp.k12.ar.us
Watson Chapel SD - hac23.esp.k12.ar.us
West Fork SD - hac23.esp.k12.ar.us
West Memphis SD - hac23.esp.k12.ar.us
West Side (Cleburne County) SD - hac23.esp.k12.ar.us
Western Yell County SD - hac23.esp.k12.ar.us
Westside Consolidated SD - hac23.esp.k12.ar.us
Westside(Johnson County) SD - hac23.esp.k12.ar.us
Westwind School for Performing Arts - hac23.esp.k12.ar.us
White County Central SD - hac23.esp.k12.ar.us
White Hall SD - hac23.esp.k12.ar.us
Wilbur D. Mills Education Service Cooperative - hac23.esp.k12.ar.us
Wonderview SD - hac23.esp.k12.ar.us
Woodlawn SD - hac23.esp.k12.ar.us
Wynne SD - hac23.esp.k12.ar.us
Yellville-Summit SD - hac23.esp.k12.ar.us`;

export const DISTRICTS = rawDistrictsText.split('\n').filter(Boolean).map((line, idx) => {
  const [name, domain] = line.split(' - ').map(s => s.trim());
  const cleanDomain = domain.replace(/^https?:\/\//, '');
  return {
    id: `${cleanDomain}-${idx}`,
    name,
    domain: cleanDomain,
    url: `https://${cleanDomain}/HomeAccess/Account/LogOn`,
  };
});

export const DEFAULT_DISTRICT = DISTRICTS.find(d => d.name.includes('Round Rock')) || DISTRICTS[0];
