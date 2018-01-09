import css from 'semantic/semantic.less';
import css from 'style/layout.less';
import Typed from 'typed/typed.js';

setTimeout(()=>{
  let typed = new Typed('.logoName', {
    strings: ['network-website', 'webdev-website', 'hackme-website'],
    typeSpeed: 1,
    backSpeed: 1,
    backDelay: 5000,
    startDelay: 10000,
    loop: true
  });
}, 5000);
