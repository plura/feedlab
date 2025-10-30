// assets/js/main.js
import { App } from './app.js';

App.init({
	rootSelector: '#app',
	postsUrl: 'assets/data/posts.json',
	templatesUrl: 'assets/data/templates.json',
	imageBase: 'assets/media/',
	scheme: 'scheme1'
});
