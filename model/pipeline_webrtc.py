class WebRTCStreamPipeline:
    def __init__(self):
        """
        TO BE IMPLEMENTED: 
        This module will eventually handle live continuous WebRTC camera streams.
        It will keep a rolling buffer of 10 minutes of frames, embed them on the fly,
        and write them to a temporary VectorDB ring-buffer.
        """
        pass

    def connect_stream(self, camera_ip):
        raise NotImplementedError("WebRTC ingestion is scheduled for V2.")
