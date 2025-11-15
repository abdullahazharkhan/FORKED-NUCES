from django.shortcuts import render
from django.http import JsonResponse

# Create your views here.
def welcomeView(request):
    return JsonResponse({"message": "Forked NUCES API is running!"})