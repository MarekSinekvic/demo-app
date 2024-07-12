import { CalendarIcon, SettingsIcon } from "@chakra-ui/icons";
import { Checkbox, Flex, Input, Popover, PopoverBody, PopoverCloseButton, PopoverContent, PopoverFooter, PopoverHeader, PopoverTrigger, Portal, Spacer, Stack, Text } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { placeArrayUnq, removeArrayUnq, toggleArrayUnq } from "../GeneralElements";

import redStripes from '../../red_stripes.jpg';
import blueStripes from '../../blue_stripes.jpg';
import greenStripes from '../../green_stripes.jpg';
import yellowStripes from '../../yellow_stripes.jpg';
import purpleStripes from '../../purple_stripes.jpg';

function Event(time, type, duration = 0, description = '', target = '', color = 'red') { // type = point | duration
    return {
        time : time, // time : [0, 24*60 = 1440]
        type : type,
        duration : duration, // duration : [...] = time

        target : target,
        description : description,

        color : color
    };
}
function TimeDivider() {
    let TimesElements = ()=>{
        let times = [];
        for (let i = 0; i < 24; i++) {
            times.push((
                <Flex key={i} direction={'column'} alignItems={'left'} position={'absolute'} left={(i/24*100)+"%"} w={1/24*100+"%"}>
                    <Flex fontSize={'12px'} justifyContent={'center'}>{i.toString().padStart(2,'0')}:00</Flex>
                    <Flex marginTop={'5px'} backgroundColor={'black'} w={'100%'} h={'0.8px'}></Flex>
                    <Flex backgroundColor={'black'} w={'0.8px'} h={'5px'}></Flex>
                </Flex>
            ));
        }
        return times;
    };
    return (
        <Flex w={"100%"} position={'relative'} justifyContent={'space-between'} marginTop={1}>
            {TimesElements()}
        </Flex>
    );
}
function EventsMarking({events = [], yOffsets = []}) {
    // find time overlaps
    let EventMark = ({time,description = ''}) => {
        let timeUV = time / 1440;
        return (
            <Flex direction={'column'} alignItems={'center'} position={'absolute'} left={`calc(${(timeUV*100)+"%"} + 0px)`} w={0}>
                <Flex w={'0.8px'} h={'10px'} backgroundColor={'black'}></Flex>
                {/* <Flex w={'10px'} h={'10px'} border={'1px solid black'} borderRadius={'50%'}></Flex> */}
                <Text fontSize={'12px'} w={'max-content'}>{Math.floor(time/60).toString().padStart(2,'0')}:{Math.round(time/60%1*60).toString().padStart(2,'0')}</Text>
                <Text fontSize={'8px'} w={'max-content'}>{description}</Text>
            </Flex>
        );//{Math.floor(time/60)} : {Math.round((time/60%1)*60)}
    }
    let EventDuratedMark = ({event,yOffset = 0}) => {
        let timeUV = event.time / 1440;
        let durationUV = event.duration / 1440;
        const stripes = ()=>{
            if (event.color == 'blue') return blueStripes;
            if (event.color == 'green') return greenStripes;
            if (event.color == 'yellow') return yellowStripes;
            if (event.color == 'purple') return purpleStripes;
            return redStripes;
        };
        return (
            <Flex position={'absolute'} left={(timeUV*100)+"%"} top={(yOffset-10)+'px'} w={(durationUV*100)+"%"} gap={1}>
                <Flex w={0} alignItems={'center'} direction={'column'} position={'absolute'} left={'0%'} top={(-yOffset)+'px'}>
                    <Flex w={'0px'} h={(10+yOffset)+'px'} borderRight={'1px dotted rgba(0,0,0,0.3)'}></Flex>
                    <Flex fontSize={10}>{event.time > 0 ? `${Math.floor(event.time/60)}:${Math.round((event.time/60)%1*60)}` : ''}</Flex>
                </Flex>
                <Popover boundary={''}>
                    <PopoverTrigger>
                        <Flex w={'100%'} h={'10px'} bgImage={stripes} bgRepeat={"repeat"} bgSize={'200px'}></Flex>
                    </PopoverTrigger>
                    <Portal>
                        <PopoverContent>
                            <PopoverCloseButton/>
                            <PopoverHeader>{(event.target == 'technics') ? 'Technics' : ''}</PopoverHeader>
                            <PopoverBody>
                                <Flex>
                                    {event.description}
                                </Flex>
                            </PopoverBody>
                        </PopoverContent>
                    </Portal>
                </Popover>
                <Flex w={0} alignItems={'center'} direction={'column'} position={'absolute'} left={'100%'} top={(-yOffset)+'px'}>
                    <Flex w={'0px'} h={(10+yOffset)+'px'} borderLeft={'1px dotted rgba(0,0,0,0.3)'}></Flex>
                    <Flex fontSize={10}>{event.time+event.duration < 1440 ? `${Math.floor(event.time/60)+Math.floor(event.duration/60)}:${Math.round((event.time/60)%1*60)+Math.round((event.duration/60)%1*60)}` : ''}</Flex>
                </Flex>
            </Flex>
        );
    }
    
    return (
        <Flex direction={'row'} w={'100%'} position={'relative'}>
            {events.map((e,i)=>{
                if (e.type == 'point') {
                    return <EventMark key={i} time={e.time} description={e.description}/>;
                } else if (e.type == 'duration') {
                    let offset = 0;
                    if (yOffsets.length == events.length) offset = yOffsets[i];
                    return <EventDuratedMark key={i} event={e} yOffset={offset}/>
                }
            })}
        </Flex>
    );
}
function sigma(x) {
    return (Math.pow(Math.E,x)-1)/(Math.pow(Math.E,x)+1);
    //return 1/(1+Math.pow(Math.E,-x));
}
function TargetDatePicker({targetDate,targetSetter, heatMap = []}) {
    let days = [];
    let currDate = new Date();
    for (let i = 0; i < new Date(targetDate[0],targetDate[1],0).getDate(); i++) {
        let targetColor;
        if (i+1 == currDate.getDate() && currDate.getMonth()+1 == targetDate[1]) targetColor = 'rgba(0,0,255,0.1)';
        targetColor = (i+1==targetDate[2]) ? 'rgba(0,0,0,0.1)' : targetColor;
        let height = 0;
        if (typeof (heatMap[i]) != 'undefined') height = heatMap[i]*0.2;
        days.push(
            (<Flex key={i} style={{position:'relative'}} backgroundColor={targetColor} w={'100%'} justifyContent={'center'} onClick={(e)=>{targetSetter([targetDate[0],targetDate[1],i+1]);}} cursor={'pointer'}>
                <Flex style={{position: 'absolute', width: '100%', height: `${sigma(height)*100}%`, backgroundColor: 'rgba(255,0,0,0.3)'}}></Flex>
                <Flex>{i+1}</Flex>
            </Flex>)
        );
    }//<Input size={'sm'} w={'200px'} type="date" onChange={(e)=>{targetSetter(new Date(e.target.value));}}/>
    return (
        <Flex direction={'row'}>
            <Flex direction={'row'} w={'100px'}>{targetDate[0]}-{targetDate[1]}-{targetDate[2]}</Flex>
            <Flex direction={'row'} justifyContent={'space-between'} alignItems={'center'} w={'100%'}>
                <Flex cursor={'default'} onClick={()=>{targetSetter([targetDate[0],targetDate[1]-1,1])}}>{'<'}</Flex>
                {days}
                <Flex cursor={'default'} onClick={()=>{targetSetter([targetDate[0],targetDate[1]+1,1])}}>{'>'}</Flex>
            </Flex>
        </Flex>
        
    );
}
function Sort(arr = [],compareFn = (a,b)=>{return a>b}) {
    let map = new Array(arr.length).fill(0).map((v,i)=>{return i;});
    let n = arr.length;
    for (let i = 0; i < n-1; i++)
        for (let j = 0; j < n-i-1; j++)
            if (compareFn(arr[j],arr[j+1])) {
                let temp = arr[j];
                arr[j] = arr[j+1];
                arr[j+1] = temp;

                const tempmap = map[j];
                map[j] = map[j+1];
                map[j+1] = tempmap;
            }
    return [arr,map];
}
function DatesTab({}) {
    const [targetDate,setTargetDate] = useState([new Date().getFullYear(),new Date().getMonth()+1,new Date().getDate(), new Date().getHours(),new Date().getMinutes(),new Date().getSeconds()]);
    const [events,setEvents] = useState([]);
    const [datesHeatMap, setDatesHeatMap] = useState([]);

    const [yOffsets, setYOffsets] = useState([]);

    const [targetTables,setTargetTables] = useState(['orders','logistics','technics','production']);
    function toggleTargetTables(state,value) {
        if (state) setTargetTables(placeArrayUnq(targetTables,value));
        else setTargetTables(removeArrayUnq(targetTables,value));
    }
    useEffect(()=>{
        let sqlFormatedTargetDate = `${targetDate[0]}-${(targetDate[1]).toString().padStart(2,'0')}-${targetDate[2].toString().padStart(2,'0')}`;
        (async ()=>{
            const addEvent = (elem)=>{
                if (events.findIndex((v)=>{
                    return elem.time == v.time;
                }) == -1) {}
                events.push(elem);
            };
            const dateIntervalToDuration = (datea, dateb) => {
                if (datea > dateb) {
                    const old = datea;
                    datea = dateb;
                    dateb = old;
                }
                let target = new Date(...targetDate);

                target.setMonth(targetDate[1]);
                datea.setMonth(datea.getMonth()+1);
                dateb.setMonth(dateb.getMonth()+1);

                if (target.getMonth() == datea.getMonth()) {
                    if (datea.getDate() == dateb.getDate()) {
                        const timea = datea.getHours()*60 + datea.getMinutes();
                        const timeb = dateb.getHours()*60 + dateb.getMinutes();
                        
                        return {time:timea,duration:timeb-timea};
                    } else {
                        if (target.getDate() == datea.getDate()) {
                            const time = datea.getHours()*60 + datea.getMinutes();
                            return {time:time,duration: 1440-time};
                        } else if (target.getDate() == dateb.getDate()) {
                            const time = dateb.getHours()*60 + dateb.getMinutes();
                            return {time:0,duration:time};
                        }  else {
                            return {time:0,duration:60*24};
                        }
                    }
                    
                }

                return {time:0,duration:0};
            }

            let events = [];
            let ordersDates = [], logisticsDates =[], technicsProfilactics=[], productionDates = [];
            if (targetTables.includes('orders'))
                ordersDates = await window.DB.getGeneralRaw(`select hour(date) as hour, minute(date) as minute from trades where (date) like '${sqlFormatedTargetDate}%'`);
            if (targetTables.includes('logistics')) 
                logisticsDates = await window.DB.getGeneralRaw(`select shipment_date as date,unloading_date from logistics where '${sqlFormatedTargetDate}' between DATE(shipment_date) and DATE(unloading_date)`);
            if (targetTables.includes('technics'))
                technicsProfilactics = await window.DB.getGeneralRaw(`select date, profilactics_date as prof_date, profilactics_time as prof_time, profilactics_description from technics where (profilactics_date) like '${sqlFormatedTargetDate}%'`);
            if (targetTables.includes('production'))
                productionDates = await window.DB.getGeneralRaw(`select date,deadline_date from production where '${sqlFormatedTargetDate}' between DATE(date) and DATE(deadline_date)`);

            // ordersDates.map((date)=>{addEvent(new Event(date.hour*60 + date.minute,'point', 0, 'order added'));});
            logisticsDates.map((date)=>{const eventTime = dateIntervalToDuration(date.date,date.unloading_date); addEvent(new Event(eventTime.time, 'duration', eventTime.duration, 'shipment date','logistics','green'))});
            productionDates.map((date)=>{const eventTime = dateIntervalToDuration(date.date,date.deadline_date); addEvent(new Event(eventTime.time, "duration",eventTime.duration,"production test",'production','blue'))});
            technicsProfilactics.map((date)=>{
                let profTime = date.prof_time.split(':').map((t)=>{return Number(t)});
                let profDate = new Date(date.prof_date);
                addEvent(new Event(profDate.getHours()*60+profDate.getMinutes(),'duration',profTime[0]*60+profTime[1], date.profilactics_description, 'technics'));
            });
            setEvents(events);
        })();
        (async ()=>{
            let heatList = [];
            for (let i = 0; i < new Date(targetDate[0],targetDate[1],0).getDate(); i++) {
                heatList.push(0);
            }
            let sqlDate = `${targetDate[0]}-${(targetDate[1]).toString().padStart(2,'0')}-%`;
            let ordersDates = [], logisticsDates =[],technicsProfilactics=[],productionDates=[];
            if (targetTables.includes('orders'))
                ordersDates = await window.DB.getGeneralRaw(`select date from trades where date like '${sqlDate}'`);
            if (targetTables.includes('logistics')) {
                logisticsDates = await window.DB.getGeneralRaw(`select shipment_date as start, unloading_date as end from logistics where shipment_date like '${sqlDate}' or unloading_date like '${sqlDate}'`);
            } if (targetTables.includes('technics'))
                technicsProfilactics = await window.DB.getGeneralRaw(`select profilactics_date as date from technics where (profilactics_date) like '${sqlDate}'`);
            if (targetTables.includes('production'))
                productionDates = await window.DB.getGeneralRaw(`select date as start,deadline_date as end from production where date like '${sqlDate}' or deadline_date like '${sqlDate}'`);

            let data = [...logisticsDates.filter((date,i)=>{return date.end === null}), ...technicsProfilactics, ...productionDates.filter((date,i)=>{return date.end === null})];
            let duratedData = [...productionDates.filter((date,i)=>{return date.end !== null}), ...logisticsDates.filter((date,i)=>{return date.end !== null})];
            for (let i = 0; i < data.length; i++) {
                let day = new Date(data[i].date).getDate()-1;
                heatList[Math.floor(day)]++;
            }
            for (let i = 0; i < duratedData.length; i++) {
                const target = duratedData[i];
                // TODO heat transfer on other months
                if (target.start.getMonth() == target.end.getMonth()) {
                    const startDay = target.start.getDate()-1;
                    const endDay = target.end.getDate();
                    for (let j = startDay; j < endDay; j++) {
                        heatList[j]++;
                    }
                }

            }
            setDatesHeatMap(heatList);
        })();
    },[targetDate,targetTables]);
    useEffect(()=>{
        // TODO symmetric offseting by sorting with time+duration
        let sortedEvents = [...events];
        let sortMap = [];
        let _sort = Sort(sortedEvents, (a,b)=>{return a.time>b.time});
        sortedEvents = _sort[0];
        sortMap = _sort[1];

        let duratedEvents = [];
        let offsets = [];
        for (let i = 0; i < sortedEvents.length; i++) {
            if (sortedEvents[i].type == 'duration' || true) {
                duratedEvents.push({ind:i,event:sortedEvents[i]});
                offsets.push(0);
            }
        }
        // console.log(duratedEvents);
        const isOverlap = (a,b) => { //
            let a_timeUV = a.time / 1440;
            let a_durationUV = a.duration / 1440;
            let b_timeUV = b.time / 1440;
            let b_durationUV = b.duration / 1440;

            if (a_timeUV <= b_timeUV && a_timeUV+a_durationUV >= b_timeUV+b_durationUV) return true;
            if (a_timeUV >= b_timeUV && a_timeUV+a_durationUV <= b_timeUV+b_durationUV) return true;

            if (a_timeUV >= b_timeUV && a_timeUV <= b_timeUV+b_durationUV) return true;
            if (a_timeUV+a_durationUV >= b_timeUV && a_timeUV+a_durationUV <= b_timeUV+b_durationUV) return true;

            return false;
        }
        const yStep = 30;
        for (let i = 0; i < duratedEvents.length; i++) {
            let xTravel = 1;
            while (i+xTravel < duratedEvents.length) {
                let state = isOverlap(duratedEvents[i].event,duratedEvents[i+xTravel].event);                
                if (state) {
                    if (offsets[i] == offsets[i+xTravel]) {
                        offsets[i] += yStep;
                        xTravel = 1;
                        continue;
                    }
                } else break;
                xTravel++;
            }
            xTravel = 1;
            while (i-xTravel >= 0) {
                let state = isOverlap(duratedEvents[i].event,duratedEvents[i-xTravel].event);
                if (state) {
                    if (offsets[i] == offsets[i-xTravel]) {
                        offsets[i] += yStep;
                        xTravel = 1;
                        continue;
                    }
                }
                xTravel++;
            }
        }
        // console.log(offsets);
        let mappedOffsets = new Array(events.length).fill(0);
        duratedEvents.map((v,i)=>{mappedOffsets[v.ind] = offsets[i]});

        let unsortedOffsets = new Array(events.length).fill(0);
        sortMap.map((newind,i)=>{unsortedOffsets[newind] = mappedOffsets[i]});

        setYOffsets(unsortedOffsets);
    },[events]);
    return (
        <Flex direction={'row'}>
            <Flex direction={'column'} w={'100%'}>
                <TargetDatePicker targetDate={targetDate} targetSetter={setTargetDate} heatMap={datesHeatMap}/>
                <Flex direction={'column'} w={"100%"} borderTop={'1px solid black'}>
                    <TimeDivider/>
                    <Flex h={10}></Flex>
                    <EventsMarking events={events} yOffsets={yOffsets}/>
                </Flex>
            </Flex>
            <Flex position={'absolute'} left={'3%'} bottom={'3%'}>
                <Popover>
                    <PopoverTrigger>
                        <SettingsIcon/>
                    </PopoverTrigger>
                    <Portal>
                        <PopoverContent>
                            <PopoverCloseButton/>
                            <PopoverHeader></PopoverHeader>
                            <PopoverBody>
                                <Stack>
                                    <Checkbox defaultChecked={true} onChange={(e)=>{toggleTargetTables(e.target.checked,'orders');}}>orders</Checkbox>
                                    <Checkbox defaultChecked={true} onChange={(e)=>{toggleTargetTables(e.target.checked,'logistics');}}>logistics</Checkbox>
                                    <Checkbox defaultChecked={true} onChange={(e)=>{toggleTargetTables(e.target.checked,'technics');}}>technics</Checkbox>
                                </Stack>
                            </PopoverBody>
                        </PopoverContent>
                    </Portal>
                </Popover>
            </Flex>
        </Flex>
    );
}
export default DatesTab;