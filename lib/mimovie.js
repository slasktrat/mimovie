var	child_process = require("child_process"),
	parseString = require('xml2js').parseString;

module.exports = function(file, done){

	var MiB = 1048576;
	var video = {};
	video.video_tracks=[];
	video.audio_tracks=[];
	video.subtitles=[];

	var vvt;
	var vat;

	child_process.execFile("mediainfo", [
		'-f',
		'--Language=raw',
		'--Output=XML',
		'--ReadByHuman',
		file
	],{ 
	  encoding: 'utf8',
	  maxBuffer: 10*MiB
	}, function(err, stdout, stderr) {

		if (err) {
			return done(err,null);
		}else{
			parseString(stdout, function (err, result) {
				// console.log(JSON.stringify(result));
				var tracks = result.Mediainfo.File[0].track;

				for(var i=0;i<tracks.length;i++){
					if(tracks[i].StreamKind=='General'){
						video.bitrate = 		parseInt(tracks[i].OverallBitRate);
						video.path = 			tracks[i].CompleteName.toString();
						video.size = 			parseInt(tracks[i].FileSize);
						video.duration = 		parseInt(tracks[i].Duration);
					}else if(tracks[i].StreamKind=='Video'){
						vvt = {
							width: 			parseInt(tracks[i].Width),
							height:			parseInt(tracks[i].Height),
							codec: 			tracks[i].Format.toString(),
							profile: 		tracks[i].Format_Profile.toString(),
							video_bitrate: 	parseInt(tracks[i].BitRate),
							fps: 			parseFloat(tracks[i].FrameRate)
						}
						if(tracks[i].DisplayAspectRatio_Strin){
							vvt.aspect.DisplayAspectRatio_Strin.toString();
						}
						video.video_tracks.push(vvt);
					}else if(tracks[i].StreamKind=='Audio'){
						vat = {
							bitrate:		parseInt(tracks[i].BitRate),
							bitrate_mode: 	tracks[i].BitRate_Mode.toString(),
							channels: 		parseInt(tracks[i].Channel_s_),
							sammple_rate: 	parseInt(tracks[i].SamplingRate),
							codec:			tracks[i].Format.toString()
						}
						if(tracks[i].Language){
							vat.lang=tracks[i].Language.toString();
						}
						if(vat.channels>2){
							vat.channels_pos=tracks[i].ChannelPositions.toString();
						}
						video.audio_tracks.push(vat);
					}else if(tracks[i].StreamKind=='Text'){
						if(tracks[i].Language){
							video.subtitles.push(tracks[i].Language.toString());
						}
					}else if(tracks[i].StreamKind=='Menu'){
						video.has_chapters = true;
					}
				}
				done(null,video);
			});
		}
	});
};